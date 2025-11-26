import { cn } from '@/lib/utils'

export interface PropDefinition {
  name: string
  type: string
  required?: boolean
  default?: string
  description: string
}

interface PropsTableProps {
  props: PropDefinition[]
  title?: string
  className?: string
}

export function PropsTable({ props, title = 'Параметры', className }: PropsTableProps) {
  return (
    <div className={cn('my-6', className)}>
      {title && (
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h4>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 pr-4 font-medium text-gray-900 dark:text-white">
                Имя
              </th>
              <th className="text-left py-3 pr-4 font-medium text-gray-900 dark:text-white">
                Тип
              </th>
              <th className="text-left py-3 pr-4 font-medium text-gray-900 dark:text-white">
                По умолчанию
              </th>
              <th className="text-left py-3 font-medium text-gray-900 dark:text-white">
                Описание
              </th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr
                key={prop.name}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-3 pr-4">
                  <code className="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded text-xs">
                    {prop.name}
                  </code>
                  {prop.required && (
                    <span className="ml-1 text-red-500 text-xs">*</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <code className="text-gray-600 dark:text-gray-400 text-xs">
                    {prop.type}
                  </code>
                </td>
                <td className="py-3 pr-4 text-gray-500 dark:text-gray-500 text-xs">
                  {prop.default ? (
                    <code>{prop.default}</code>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-3 text-gray-600 dark:text-gray-400">
                  {prop.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
        <span className="text-red-500">*</span> — обязательный параметр
      </p>
    </div>
  )
}
