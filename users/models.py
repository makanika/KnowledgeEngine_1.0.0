from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

# -- Model for Organizing Staff --
class Department(models.Model):
    """
    Represents a department within the organization.
    e.g., 'Facilities Operations', 'Network Operations Center', 'Security'
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

# -- Models for Tracking Skills and Certifications --
class Certification(models.Model):
    """
    Represents a specific, official certification.
    e.g., 'Certified Data Centre Technician', 'Schneider Electric UPS Certified'
    """
    name = models.CharField(max_length=200, unique=True)
    issuing_organization = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

# -- The Main User Model --
class CustomUser(AbstractUser):
    """
    The definitive User model for a datacenter employee.
    """
    class Role(models.TextChoices):
        TECHNICIAN = 'TECHNICIAN', 'Technician'
        ENGINEER = 'ENGINEER', 'Engineer'
        MANAGER = 'MANAGER', 'Manager'
        ADMIN = 'ADMIN', 'Admin'

    # Core user details inherited from AbstractUser:
    # username, first_name, last_name, email, is_staff, is_active, date_joined

    # Custom fields for datacenter context
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.TECHNICIAN)
    job_title = models.CharField(max_length=100, help_text="e.g., 'Lead Mechanical Engineer'")
    phone_number = models.CharField(max_length=20, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    is_on_call = models.BooleanField(default=False, help_text="Is this user currently the primary on-call contact?") # Add this line
    
    # ManyToMany relationship to track all certifications a user holds.
    # We use a 'through' model to store extra data like achievement dates.
    certifications = models.ManyToManyField(
        Certification,
        through='UserCertification',
        related_name='holders'
    )

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.job_title})"

# -- "Through" Model to connect Users and Certifications --
class UserCertification(models.Model):
    """
    Links a User to a Certification and stores details about
    when it was achieved and when it expires.
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    date_achieved = models.DateField()
    expiry_date = models.DateField(null=True, blank=True, help_text="Leave blank if certification does not expire.")
    certificate_id = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = ('user', 'certification') # A user can't have the same cert twice

    def is_expired(self):
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return True
        return False
    
    def __str__(self):
        return f"{self.user.username} - {self.certification.name}"

# -- Model for Shifts --
class Shift(models.Model):
    """
    Tracks the shifts for on-duty engineers.
    """
    engineer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='shifts')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True, help_text="Handover notes for the next shift.")

    def __str__(self):
        return f"{self.engineer.username} Shift starting {self.start_time.strftime('%Y-%m-%d %H:%M')}"