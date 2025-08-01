from django.db import models

class Vendor(models.Model):
    """
    Represents a supplier or maintenance provider (e.g., Schneider Electric, Vertiv, Caterpillar).
    """
    name = models.CharField(max_length=100, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    contact_email = models.EmailField(blank=True)
    support_phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name

class AssetCategory(models.Model):
    """
    A category for assets (e.g., 'Power', 'Cooling', 'Fire Systems', 'Generators').
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Asset Categories'

    def __str__(self):
        return self.name

class Asset(models.Model):
    """
    A detailed model for grey space infrastructure.
    """
    class Status(models.TextChoices):
        IN_SERVICE = 'IN_SERVICE', 'In Service'
        IN_MAINTENANCE = 'IN_MAINTENANCE', 'In Maintenance'
        DECOMMISSIONED = 'DECOMMISSIONED', 'Decommissioned'
        FAULT = 'FAULT', 'Fault'

    name = models.CharField(max_length=100)
    category = models.ForeignKey(AssetCategory, on_delete=models.PROTECT, related_name='assets')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_SERVICE)
    is_critical = models.BooleanField(default=False, help_text="Is this a critical, non-redundant asset?")
    
    # Flexible location description for grey space
    location_description = models.TextField(blank=True, help_text="e.g., 'Generator Yard, Unit 1' or 'Pump Room, North Wall'")
    
    # Essential identifiers and vendor info
    serial_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    asset_tag = models.CharField(max_length=50, unique=True, blank=True, null=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, blank=True, null=True)
    
    # Lifecycle and maintenance dates
    install_date = models.DateField(blank=True, null=True)
    warranty_expiry_date = models.DateField(blank=True, null=True)
    last_maintenance_date = models.DateField(blank=True, null=True)
    next_maintenance_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.asset_tag or self.serial_number})"

class SystemLog(models.Model):
    """
    Represents a single log entry from a piece of equipment (BMS, etc.).
    """
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='logs')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.asset.name} @ {self.timestamp.strftime('%Y-%m-%d %H:%M')}"