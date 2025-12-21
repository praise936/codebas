

# backend/execution/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .services import CodeExecutor

class ExecuteCodeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        code = request.data.get('code', '')
        language = request.data.get('language', 'python')
        
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if language != 'python':
            return Response({'error': 'Only Python is supported for now'}, status=status.HTTP_400_BAD_REQUEST)
        
        result = CodeExecutor.execute_python(code)
        return Response(result)