sap.ui.define(
  ['sap/ui/test/Opa5', 'sap/ui/test/actions/Press'],
  function (Opa5, Press) {
    'use strict'

    Opa5.createPageObjects({
      onTheMainPage: {
        actions: {
          iPressTheSayHelloButton: function () {
            return this.waitFor({
              id: 'button0',
              viewName: 'auth.sample.js.App',
              actions: new Press(),
              errorMessage:
                "Did not find the 'Click me!' button on the App view"
            })
          }
        },

        assertions: {
          iShouldSeeTheHelloDialog: function () {
            return this.waitFor({
              // Turn off autoWait
              autoWait: false,
              check: function () {
                // Locate the message toast using its class name in a jQuery function
                return Opa5.getJQuery()('.sapMMessageToast').length > 0
              },
              success: function () {
                Opa5.assert.ok(true, 'The message toast was shown')
              },
              errorMessage: 'The message toast did not show up'
            })
          }
        }
      }
    })
  }
)
