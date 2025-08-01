from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Department, Certification, UserCertification, Shift

class UserCertificationInline(admin.TabularInline):
    model = UserCertification
    extra = 1  # How many extra forms to show
    verbose_name = "User Certification"
    verbose_name_plural = "User Certifications"

class ShiftInline(admin.TabularInline):
    model = Shift
    extra = 1

class CustomUserAdmin(UserAdmin):
    # Add our custom fields to the admin display
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'department', 'is_staff')
    list_filter = ('role', 'department', 'is_staff', 'is_superuser', 'is_active', 'groups')
    
    # Add custom fields to the user editing form (fieldsets)
    # This adds a new section "Datacenter Info" to the user page
    fieldsets = UserAdmin.fieldsets + (
        ('Datacenter Info', {'fields': ('role', 'job_title', 'department')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Datacenter Info', {'fields': ('role', 'job_title', 'department')}),
    )
    
    # Add the inlines for certifications and shifts
    inlines = [UserCertificationInline, ShiftInline]

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ('name', 'issuing_organization')
    search_fields = ('name', 'issuing_organization')

# Register the main CustomUser model with its custom admin class
admin.site.register(CustomUser, CustomUserAdmin)