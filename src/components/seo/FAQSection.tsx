import { FAQItem } from '@/types/seo';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQSectionProps {
  items: FAQItem[];
  className?: string;
  title?: string;
  showSchema?: boolean;
  collapsible?: boolean;
}

export default function FAQSection({
  items,
  className,
  title = 'Frequently Asked Questions',
  showSchema = true,
  collapsible = true,
}: FAQSectionProps) {
  if (items.length === 0) {
    return null;
  }

  // Generate JSON-LD FAQPage schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  if (collapsible) {
    return (
      <section className={cn('', className)}>
        {/* JSON-LD Schema */}
        {showSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        )}

        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.answer }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    );
  }

  // Non-collapsible version (all expanded)
  return (
    <section className={cn('', className)}>
      {/* JSON-LD Schema */}
      {showSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index}>
            <h3 className="font-medium mb-2">{item.question}</h3>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: item.answer }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Empty FAQ placeholder for admin
export function FAQPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center text-muted-foreground',
        className
      )}
    >
      <p className="font-medium">FAQ Section</p>
      <p className="text-sm mt-1">
        Add questions and answers in the post editor to display FAQ schema
      </p>
    </div>
  );
}

// Single FAQ item component for inline use
export function FAQItemDisplay({
  item,
  className,
  showSchema = false,
}: {
  item: FAQItem;
  className?: string;
  showSchema?: boolean;
}) {
  const itemSchema = showSchema
    ? {
        '@context': 'https://schema.org',
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      }
    : null;

  return (
    <div className={cn('', className)}>
      {showSchema && itemSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemSchema) }}
        />
      )}
      <dt className="font-medium">{item.question}</dt>
      <dd
        className="mt-1 text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: item.answer }}
      />
    </div>
  );
}
