# backend/execution/services.py - improved
import subprocess
import tempfile
import os
import sys
import re

try:
    import resource  # Unix-only, used to apply limits
except Exception:
    resource = None

class CodeExecutor:
    @staticmethod
    def _apply_limits():
        """
        Apply soft resource limits (Unix only).
        - Limit CPU seconds
        - Limit address space (memory)
        """
        if resource:
            # 2 seconds of CPU time
            resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
            # Limit memory to ~256MB
            mem_bytes = 256 * 1024 * 1024
            resource.setrlimit(resource.RLIMIT_AS, (mem_bytes, mem_bytes))

    @staticmethod
    def _replace_inputs(code, inputs):
        """
        Replace input(...) calls in code with provided inputs.
        Replacement is done left-to-right: the first input() -> inputs[0], etc.
        If inputs list is shorter than required, a default string is used.
        This naive approach works for simple cases and is safer than executing
        interactive prompts in the worker.
        """
        if not inputs:
            inputs = []

        # Pattern to find input(...) occurrences. This captures the entire input(...) expression.
        pattern = re.compile(r'input\s*\(\s*(?:[^()]*|\([^()]*\))*\s*\)')

        idx = 0
        def repl(match):
            nonlocal idx
            value = inputs[idx] if idx < len(inputs) else 'Test Input'
            idx += 1
            # Use repr to preserve quotes and escapes
            return repr(value)

        # Perform replacement
        new_code = pattern.sub(repl, code)
        return new_code, idx  # idx = number of replacements made

    @staticmethod
    def execute_python(code, inputs=None, timeout=5):
        """
        Execute Python code safely-ish.
        - Replaces input() with provided inputs
        - Uses sys.executable
        - Applies basic resource limits on Unix
        """
        if inputs is None:
            inputs = []

        # Ensure UTF-8 header
        code_with_header = '# -*- coding: utf-8 -*-\n' + code

        # Replace input() calls with provided test inputs
        processed_code, replaced_count = CodeExecutor._replace_inputs(code_with_header, inputs)

        # Create temporary file
        fd, temp_path = tempfile.mkstemp(suffix='.py', text=True)
        os.close(fd)
        try:
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(processed_code)

            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'

            # Choose interpreter; use same Python running the server
            python_exe = sys.executable or 'python3'

            # Prepare subprocess parameters
            kwargs = dict(
                args=[python_exe, temp_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                env=env,
                timeout=timeout
            )

            # On Unix, run with resource limits via preexec_fn
            if resource:
                kwargs['preexec_fn'] = CodeExecutor._apply_limits

            result = subprocess.run(**kwargs)

            output = result.stdout or ''
            error = result.stderr or ''

            # If any input() were present we replaced them; add a note for transparency
            if replaced_count > 0:
                output = "⚠️ Note: input() calls were replaced with provided test inputs (or defaults).\n" + output

            return {
                'output': output,
                'error': error,
                'return_code': result.returncode
            }

        except subprocess.TimeoutExpired:
            return {
                'output': '',
                'error': f'Code execution timed out after {timeout} seconds',
                'return_code': -1
            }
        except Exception as e:
            return {
                'output': '',
                'error': f'Execution failed: {str(e)}',
                'return_code': -1
            }
        finally:
            try:
                os.unlink(temp_path)
            except Exception:
                pass