from django.db import models
from django.conf import settings

# Helper function to generate the next incident number
def get_next_incident_number():
    last_incident = Incident.objects.all().order_by('number').last()
    if not last_incident:
        return 'RX-UG-INC000001'
    
    last_number = int(last_incident.number.split('INC')[-1])
    new_number = last_number + 1
    return f'RX-UG-INC{new_number:06d}'

class Incident(models.Model):
    """
    A comprehensive incident model with an auto-generating primary key,
    SLA tracking, and ITIL-aligned fields.
    """
    class Priority(models.TextChoices):
        CRITICAL = '1', '1 - Critical'
        HIGH = '2', '2 - High'
        MODERATE = '3', '3 - Moderate'
        LOW = '4', '4 - Low'

    class State(models.TextChoices):
        NEW = 'NEW', 'New'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        PENDING = 'PENDING', 'Pending'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    # Custom Primary Key
    number = models.CharField(max_length=20, primary_key=True, default=get_next_incident_number, editable=False)
    
    # Core Details
    short_description = models.CharField(max_length=255)
    description = models.TextField()
    state = models.CharField(max_length=20, choices=State.choices, default=State.NEW)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MODERATE)
    
    # Relationships
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_incidents')
    affected_assets = models.ManyToManyField('assets.Asset', blank=True, related_name='incidents')
    
    # SLA and Resolution Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    
    # Post-Mortem / Root Cause Analysis (RCA)
    resolution_notes = models.TextField(blank=True, null=True)
    root_cause = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.number}: {self.short_description}"

class Activity(models.Model):
    """
    A detailed log of all actions taken on an incident.
    """
    class ActivityType(models.TextChoices):
        COMMENT = 'COMMENT', 'Comment'
        STATE_CHANGE = 'STATE_CHANGE', 'State Change'
        ASSIGNMENT = 'ASSIGNMENT', 'Assignment'
        ATTACHMENT = 'ATTACHMENT', 'Attachment'

    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices, default=ActivityType.COMMENT)
    entry = models.TextField()
    attachment = models.FileField(upload_to='attachments/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Activities'

    def __str__(self):
        return f"Update for {self.incident.number} by {self.user.username if self.user else 'System'}"

class KnowledgeBaseArticle(models.Model):
    """
    Stores manuals, procedures, or common fixes.
    """
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    related_assets = models.ManyToManyField('assets.Asset', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title