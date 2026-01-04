
$replacements = @{
    # PageHeader
    "from '../common/PageHeader'"                = "from '@/shared/components/forms/PageHeader'"
    "from './common/PageHeader'"                 = "from '@/shared/components/forms/PageHeader'"
    
    # ErrorBoundary
    "from '../common/ErrorBoundary'"             = "from '@/shared/components/forms/ErrorBoundary'"
    "from './common/ErrorBoundary'"              = "from '@/shared/components/forms/ErrorBoundary'"
    
    # Skeleton
    "from '../common/Skeleton'"                  = "from '@/shared/components/forms/Skeleton'"
    "from './common/Skeleton'"                   = "from '@/shared/components/forms/Skeleton'"
    "from '@/shared/components/common/Skeleton'" = "from '@/shared/components/forms/Skeleton'"
    
    # SelectMarketplace
    "from '../common/SelectMarketplace'"         = "from '@/shared/components/forms/SelectMarketplace'"
    "from './common/SelectMarketplace'"          = "from '@/shared/components/forms/SelectMarketplace'"
    
    # FormActions
    "from '../common/FormActions'"               = "from '@/shared/components/forms/FormActions'"
    "from './common/FormActions'"                = "from '@/shared/components/forms/FormActions'"
    
    # FormField
    "from '../common/FormField'"                 = "from '@/shared/components/forms/FormField'"
    "from './common/FormField'"                  = "from '@/shared/components/forms/FormField'"
    
    # Input
    "from '../common/Input'"                     = "from '@/shared/components/forms/Input'"
    "from './common/Input'"                      = "from '@/shared/components/forms/Input'"
    
    # IconButton
    "from '../common/IconButton'"                = "from '@/shared/components/forms/IconButton'"
    "from './common/IconButton'"                 = "from '@/shared/components/forms/IconButton'"
    
    # SelectField
    "from '../common/SelectField'"               = "from '@/shared/components/forms/SelectField'"
    "from './common/SelectField'"                = "from '@/shared/components/forms/SelectField'"
    
    # TextAreaField
    "from '../common/TextAreaField'"             = "from '@/shared/components/forms/TextAreaField'"
    "from './common/TextAreaField'"              = "from '@/shared/components/forms/TextAreaField'"
    
    # Sidebar (Note: Sidebar is in layout)
    "from '../common/Sidebar'"                   = "from '@/shared/components/layout/Sidebar'"
    "from './common/Sidebar'"                    = "from '@/shared/components/layout/Sidebar'"
    "from '@/shared/components/forms/Sidebar'"   = "from '@/shared/components/layout/Sidebar'"
}

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content

        foreach ($key in $replacements.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $replacements[$key])
            }
        }

        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -Force
            Write-Host "Fixed components rel imports in: $($file.Name)"
        }
    }
    catch {
        Write-Error "Error processing $($file.Name): $_"
    }
}
