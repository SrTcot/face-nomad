from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(allowed_roles):
    """
    Decorator para verificar que el usuario tenga uno de los roles permitidos
    Uso: @role_required(['admin', 'supervisor'])
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            
            user_role = claims.get('role')
            
            if not user_role or user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "Acceso denegado - Permisos insuficientes"
                }), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required():
    """
    Decorator para endpoints que requieren rol de administrador
    Uso: @admin_required()
    """
    return role_required(['admin'])


def supervisor_or_admin_required():
    """
    Decorator para endpoints que requieren supervisor o admin
    Uso: @supervisor_or_admin_required()
    """
    return role_required(['admin', 'supervisor'])
