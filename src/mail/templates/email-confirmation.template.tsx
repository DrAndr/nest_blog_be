import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

export interface EmailConfirmationTemplateProps {
  domain: string;
  token: string;
  uri: string;
  email?: string;
}

export function EmailConfirmationTemplate({
  domain,
  token,
  uri,
  email = 'example@email.com',
}: EmailConfirmationTemplateProps) {
  const confirmationLink = `${domain}${uri}?token=${token}`;

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
                Hello! Please verify your email.
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
              <Text style={{ marginTop: 0 }}>
                Thank you for registering. Please confirm your email address:
              </Text>

              <Text
                style={{
                  fontWeight: 'bold',
                  color: '#2b6cb0',
                  wordBreak: 'break-all',
                }}
              >
                {email}
              </Text>

              {/* Button */}
              <Section style={{ textAlign: 'center', margin: '32px 0' }}>
                <Button
                  href={confirmationLink}
                  style={{
                    backgroundColor: '#2b6cb0',
                    color: '#ffffff',
                    textDecoration: 'none',
                    padding: '14px 24px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                  }}
                >
                  Verify email
                </Button>
              </Section>

              <Text
                style={{
                  fontSize: '14px',
                  color: '#777777',
                }}
              >
                If you did not create an account, you can safely ignore this
                email.
              </Text>
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
              © {new Date().getFullYear()} Your App. All rights reserved.
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
