from rest_framework import permissions
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
        if request.user.is_superuser:
            return True

        # Normal users can only act on their own object
        return obj == request.user

class IsRedactor(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)
        return bool(profile and profile.user_type == "redactor")

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)

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
    