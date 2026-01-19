from rest_framework import permissions

class IsSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )

class IsAuthorOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False           
        return request.user.is_staff or obj.author == request.user

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.is_staff or obj.author == request.user

class IsAdminOrSelf(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        # Admins can do anything
        if request.user.is_staff:
            return True

        # Normal users can only act on their own object
        return obj == request.user

class IsRedactor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has a profile and user_type is 'redactor'
        profile = getattr(request.user, "profile", None)
        if profile and profile.user_type == "redactor":
            return True

        return False

class IsRedactorOrReadOnlyObject(permissions.BasePermission):

    def has_permission(self, request, view):
    # SAFE_METHODS are always allowed
        if request.method in permissions.SAFE_METHODS:
            return True

    # Write methods require redactor
        user = request.user
        if not user.is_authenticated:
            return False

        profile = getattr(user, "profile", None)
        return profile and profile.user_type == 'redactor'

    def has_object_permission(self, request, view, obj):
            if request.method in permissions.SAFE_METHODS:
                return True

            user = request.user
            if not user.is_authenticated:
                return False

            profile = getattr(user, "profile", None)
            return (profile and profile.user_type == 'redactor') and obj.author==request.user

class IsAuthor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.author==request.user
    