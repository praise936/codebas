# backend/execution/services.py - FINAL SIMPLE VERSION
import subprocess
import tempfile
import os

class CodeExecutor:
    @staticmethod
    def execute_python(code, timeout=5):
        """
        Execute Python code safely
        - Disables input() to prevent timeouts
        - Supports UTF-8 for emojis
        """
        # 1. Add UTF-8 encoding for emoji support
        code = '# -*- coding: utf-8 -*-\n' + code
        
        # 2. Disable input() to prevent hanging
        # Replace input() with a string containing the prompt
        import re
        
        # Simple approach: Comment out input() lines
        lines = code.split('\n')
        processed_lines = []
        
        for line in lines:
            if 'input(' in line and not line.strip().startswith('#'):
                # Try to replace input() with a fixed string
                # Example: name = input("Enter name: ") becomes name = "Test User"
                if '=' in line:
                    # Split at = and keep the variable assignment
                    parts = line.split('=')
                    if len(parts) == 2:
                        var_name = parts[0].strip()
                        # Create a simple assignment instead
                        line = f"{var_name} = 'Test Input'  # input() disabled in web editor"
            
            processed_lines.append(line)
        
        processed_code = '\n'.join(processed_lines)
        
        # 3. Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(processed_code)
            temp_file = f.name
        
        try:
            # 4. Set UTF-8 environment
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            
            # 5. Execute code
            result = subprocess.run(
                ['python', temp_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding='utf-8',
                errors='ignore',
                env=env
            )
            
            # 6. Return results
            output = result.stdout
            error = result.stderr
            
            # Add note about input() if we modified the code
            if 'input(' in code:
                output = "⚠️ Note: input() was disabled in web execution mode\n" + output
            
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
            # 7. Clean up
            try:
                os.unlink(temp_file)
            except:
                pass