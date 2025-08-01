from django.contrib import admin
from .models import Incident, Activity, KnowledgeBaseArticle

class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 1
    fields = ('user', 'activity_type', 'entry', 'attachment')

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('number', 'short_description', 'state', 'priority', 'assignee', 'created_at')
    list_filter = ('state', 'priority', 'assignee')
    search_fields = ('number', 'short_description', 'description')
    
    # Make auto-generated fields read-only in the admin
    readonly_fields = ('number', 'created_at', 'updated_at')
    
    # Organize the incident form
    fieldsets = (
        ('Incident Details', {
            'fields': ('number', 'short_description', 'description', 'affected_assets')
        }),
        ('Assignment & Status', {
            'fields': ('state', 'priority', 'assignee')
        }),
        ('Timestamps (Read-Only)', {
            'fields': ('created_at', 'updated_at', 'resolved_at', 'closed_at'),
            'classes': ('collapse',) # Make this section collapsible
        }),
        ('Resolution Details', {
            'fields': ('resolution_notes', 'root_cause')
        }),
    )
    
    inlines = [ActivityInline]

@admin.register(KnowledgeBaseArticle)
class KnowledgeBaseArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'updated_at')
    search_fields = ('title', 'content')