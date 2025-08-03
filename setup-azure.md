# Azure Speech Service Setup

## Quick Setup

The pronunciation assessment requires Azure Speech Service credentials. Follow these steps:

### 1. Create Azure Speech Service Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Speech Services"
4. Create a new Speech Services resource
5. Choose your subscription, resource group, and region
6. Select pricing tier (Free tier F0 is sufficient for testing)

### 2. Get Your Credentials

After creating the resource:
1. Go to your Speech Services resource in Azure Portal
2. Click on "Keys and Endpoint" in the left sidebar
3. Copy **Key 1** (this is your AZURE_SPEECH_KEY)
4. Note the **Region** (e.g., "eastus", "westeurope")

### 3. Configure Environment Variables

Create a `.env` file in your project root with:

```bash
# Azure Speech Services - Required for pronunciation assessment
AZURE_SPEECH_KEY="paste-your-key-here"
AZURE_SPEECH_REGION="your-region-here"  # e.g., "eastus", "westeurope"

# Optional: Other environment variables
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Restart Your Development Server

After adding the environment variables:
```bash
npm run dev
```

### 5. Verify Configuration

1. Open the pronunciation assessment interface
2. Look for the "🔧 Azure Speech Service Status" section
3. It should show "Configured" in green

## Common Regions

- East US: `eastus`
- West Europe: `westeurope`  
- West US 2: `westus2`
- Southeast Asia: `southeastasia`
- Central US: `centralus`

## Troubleshooting

**If you see "Not Configured":**
- Check that your `.env` file is in the project root
- Verify the environment variable names are exactly correct
- Restart your development server
- Check that your Azure key is active and hasn't expired

**If pronunciation scores are still zero:**
- Verify you're speaking Romanian (the system is configured for ro-RO)
- Check the server console logs for Azure errors
- Ensure your microphone is working properly
- Try speaking the exact reference text without pauses

## Testing

Once configured, try these test phrases:
- "Bună ziua" (Good day)
- "Mulțumesc" (Thank you) 
- "La revedere" (Goodbye)

The system works best with:
- Clear pronunciation
- Normal speaking speed
- Minimal background noise
- Speaking the complete phrase without long pauses 