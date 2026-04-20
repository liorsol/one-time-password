import { renderCreator } from "../../../shared/html/creator";

export function renderGasCreator(): string {
  return renderCreator({
    submitHandler: `
          google.script.run
            .withSuccessHandler(function(result) { onSuccess(result); })
            .withFailureHandler(function(err) { onFailure(err.message || err); })
            .createSecret({
              encryptedText: encrypted.encryptedText,
              iv: encrypted.iv,
              salt: encrypted.salt
            });
    `,
  });
}
