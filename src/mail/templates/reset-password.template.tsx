import * as React from 'react';

import { BaseConfirmationTemplate } from './components/base-mail.template';
export interface IResetPasswordTemplateProps {
  domain: string;
  token: string;
  uri: string;
}

export function ResetPasswordTemplate({
  domain,
  uri, // auth/reset-password
  token,
}: IResetPasswordTemplateProps) {
  const confirmationLink = `${domain}${uri}?token=${token}`;

  return (
    <BaseConfirmationTemplate
      domain={domain}
      link={confirmationLink}
      heading={'Please confirm password reset.'}
      buttonName={'Reset password'}
      title={'The reset password action has ben initiated.'}
      description={
        'If you did not initiated password reset, you can safely ignore.'
      }
    />
  );
}
