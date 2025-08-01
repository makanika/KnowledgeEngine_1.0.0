from django.contrib import admin
from .models import Vendor, AssetCategory, Asset, SystemLog

class SystemLogInline(admin.TabularInline):
    model = SystemLog
    extra = 0  # Don't show extra forms, just existing logs
    readonly_fields = ('message', 'timestamp') # Logs should be read-only
    can_delete = False

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_tag', 'category', 'status', 'is_critical', 'next_maintenance_date')
    list_filter = ('status', 'category', 'vendor', 'is_critical')
    search_fields = ('name', 'asset_tag', 'serial_number', 'location_description')
    
    # Organize the edit form into logical sections
    fieldsets = (
        ('Core Information', {
            'fields': ('name', 'category', 'status', 'is_critical', 'asset_tag', 'serial_number')
        }),
        ('Location & Vendor', {
            'fields': ('location_description', 'vendor')
        }),
        ('Lifecycle & Maintenance', {
            'fields': ('install_date', 'warranty_expiry_date', 'last_maintenance_date', 'next_maintenance_date')
        }),
    )
    
    inlines = [SystemLogInline]

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'support_phone')
    search_fields = ('name',)

@admin.register(AssetCategory)
class AssetCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ('asset', 'message', 'timestamp')
    list_filter = ('asset',)