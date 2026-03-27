// Cognito config placeholder
// Se configurará en Sprint B con Amplify completo
export const cognitoConfig = {
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'sa-east-1',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
}
