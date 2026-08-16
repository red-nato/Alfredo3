export const handler = async (event) => {
  const sessions = event.request.session ?? [];

  if (event.triggerSource === 'DefineAuthChallenge_Authentication') {
    const last = sessions.at(-1);
    event.response.issueTokens = Boolean(last?.challengeName === 'CUSTOM_CHALLENGE' && last?.challengeResult);
    event.response.failAuthentication = sessions.length >= 3 && !event.response.issueTokens;
    event.response.challengeName = event.response.issueTokens || event.response.failAuthentication ? undefined : 'CUSTOM_CHALLENGE';
  }

  if (event.triggerSource === 'CreateAuthChallenge_Authentication') {
    event.response.publicChallengeParameters = { prompt: 'Código de acceso del AWS Lab' };
    event.response.privateChallengeParameters = { answer: process.env.DEMO_ADMIN_CODE || '' };
    event.response.challengeMetadata = 'MISION_EMPRENDE_LAB_ADMIN';
  }

  if (event.triggerSource === 'VerifyAuthChallengeResponse_Authentication') {
    const expected = event.request.privateChallengeParameters?.answer || '';
    event.response.answerCorrect = Boolean(expected && event.request.challengeAnswer === expected);
  }

  return event;
};
