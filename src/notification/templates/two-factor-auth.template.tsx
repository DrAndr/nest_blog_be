import * as React from 'react';

import { BaseConfirmationTemplate } from './components/base-mail.template';
export interface ITwoFactorAuthProps {
  domain: string;
  token: string;
}

export function TwoFactorAuthTemplate({ domain, token }: ITwoFactorAuthProps) {
  return (
    <BaseConfirmationTemplate
      domain={domain}
      heading={'Two factor authentication.'}
      title={`Your code: <strong>${token}</strong>`}
      description={'Use this code for finish two-factor authentication.'}
    />
  );
}
