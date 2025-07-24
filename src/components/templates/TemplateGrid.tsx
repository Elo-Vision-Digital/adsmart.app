import { TemplateCard } from './TemplateCard'
import { availableTemplates, type TemplateData } from './templateData'

interface TemplateGridProps {
  onSelectTemplate: (templateId: string) => void
  templates?: TemplateData[] // Opcional: permite filtrar templates
  className?: string // Opcional: classes CSS adicionais
}

export function TemplateGrid({ 
  onSelectTemplate, 
  templates = availableTemplates,
  className = ''
}: TemplateGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 ${className}`}>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          id={template.id}
          platform={template.platform}
          category={template.category}
          type={template.type}
          imageUrl={template.imageUrl}
          features={template.features}
          onSelect={onSelectTemplate}
        />
      ))}
    </div>
  )
}

// Export para facilitar imports
export { availableTemplates } from './templateData'
export type { TemplateData } from './templateData'