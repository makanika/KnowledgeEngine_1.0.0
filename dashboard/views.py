from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from collections import defaultdict

# Note: Adjust these imports to match your actual model names and locations
from assets.models import Asset
from incidents.models import Incident
# from users.models import CustomUser, Shift

@login_required
def dashboard_view(request):
    """
    Fetches all the necessary data for the main dashboard.
    """
    # 1. Fetch open incidents
    # Assuming 'state' is a field on your Incident model
    open_incidents = Incident.objects.filter(state__in=['New', 'In Progress']).order_by('priority')

    # 2. Fetch and group all assets by category
    all_assets = Asset.objects.all().order_by('name')
    assets_by_category = defaultdict(list)
    for asset in all_assets:
        # Assuming 'category' is a field on your Asset model
        assets_by_category[asset.category.name.lower()].append(asset)

    # 3. Define the categories to display in the template
    asset_categories = [
        {'name': 'power', 'grid_class': 'asset-grid-3', 'is_active': True},
        {'name': 'cooling', 'grid_class': 'asset-grid-3', 'is_active': False},
        {'name': 'batteries', 'grid_class': 'asset-grid-2', 'is_active': False},
        {'name': 'plumbing', 'grid_class': 'asset-grid-3', 'is_active': False},
        {'name': 'fire', 'grid_class': 'asset-grid-3', 'is_active': False},
        {'name': 'generators', 'grid_class': 'asset-grid-2', 'is_active': False},
        {'name': 'cameras', 'grid_class': 'asset-grid-4', 'is_active': False},
    ]

    context = {
        'incidents': open_incidents,
        'assets_by_category': dict(assets_by_category),
        'asset_categories': asset_categories,
        'on_duty_user': request.user, # Placeholder: Replace with your on-duty logic
    }
    return render(request, 'dashboard/dashboard.html', context)