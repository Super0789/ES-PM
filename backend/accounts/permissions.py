from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Only users with role='admin'."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsEditorOrAbove(BasePermission):
    """Users with role in admin or editor."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'editor')
        )


class IsViewerOrAbove(BasePermission):
    """Any authenticated user (admin, editor, viewer)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
