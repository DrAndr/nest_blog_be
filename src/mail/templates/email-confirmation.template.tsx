import * as React from 'react';
import { BaseConfirmationTemplate } from './components/base-mail.template';

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
    <BaseConfirmationTemplate
      domain={domain}
      link={confirmationLink}
      heading={'Hello! Please verify your email.'}
      title={'Thank you for registering. Please confirm your email address:'}
      buttonName={'Verify email'}
      description={
        'If you did not create an account, you can safely ignore this email.'
      }
    />
  );
}
