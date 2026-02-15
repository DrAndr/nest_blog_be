import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

export interface IBaseConfirmationTemplateProps {
  domain: string;
  link?: string;
  heading: string;
  buttonName?: string;
  description?: string;
  title?: string;
}

export function BaseConfirmationTemplate({
  domain,
  link,
  heading,
  buttonName,
  description,
  title,
}: IBaseConfirmationTemplateProps) {
  return (
    <Html lang="en">
      <Head />

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#e6f2ff',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <Container
          style={{
            backgroundColor: '#e6f2ff',
            padding: '40px 0',
          }}
        >
          {/* White card */}
          <Section
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {/* Header */}
            <Section
              style={{
                backgroundColor: '#2b6cb0',
                color: '#ffffff',
                padding: '20px 24px',
              }}
            >
              <Heading
                as="h1"
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              >
                {heading}
              </Heading>
            </Section>

            {/* Body */}
            <Section
              style={{
                padding: '24px',
                color: '#333333',
                fontSize: '16px',
              }}
            >
              {title && <Text style={{ marginTop: 0 }}>{title}</Text>}

              {/* Button */}
              {buttonName && link && (
                <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                  <Button
                    href={link}
                    style={{
                      backgroundColor: '#2b6cb0',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '14px 24px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                    }}
                  >
                    {buttonName}
                  </Button>
                </Section>
              )}

              {description && (
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#777777',
                  }}
                >
                  {description}
                </Text>
              )}
            </Section>

            {/* Footer */}
            <Hr style={{ borderColor: '#f0f0f0', margin: 0 }} />

            <Section
              style={{
                padding: '16px 24px',
                fontSize: '12px',
                color: '#999999',
                textAlign: 'center',
                backgroundColor: '#f7f9fc',
              }}
            >
              © {new Date().getFullYear()} {domain}.
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
