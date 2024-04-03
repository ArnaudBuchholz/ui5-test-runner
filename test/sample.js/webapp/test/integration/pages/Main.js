sap.ui.define(['sap/ui/test/Opa5', 'sap/ui/test/actions/Press'], function (Opa5, Press) {
  'use strict'

  Opa5.createPageObjects({
    onTheMainPage: {
      actions: {
        iPressTheSayHelloButton: function () {
          return this.waitFor({
            id: 'helloButton',
            viewName: 'sample.js.view.Main',
            actions: new Press(),
            errorMessage: "Did not find the 'Say Hello With Dialog' button on the App view"
          })
        },

        iPressTheOkButtonInTheDialog: function () {
          return this.waitFor({
            controlType: 'sap.m.Button',
            searchOpenDialogs: true,
            viewName: 'sample.js.view.Main',
            actions: new Press(),
            errorMessage: "Did not find the 'OK' button in the Dialog"
          })
        }
      },

      assertions: {
        iShouldSeeTheHelloButton: function () {
          return this.waitFor({
            id: 'helloButton',
            viewName: 'sample.js.view.Main',
            success: function () {
              Opa5.assert.ok(true, 'The hello button is visible')
            },
            errorMessage: "Did not find the 'Say Hello With Dialog' button on the App view"
          })
        },

        iShouldSeeTheHelloDialog: function () {
          return this.waitFor({
            controlType: 'sap.m.Dialog',
            success: function () {
              Opa5.assert.ok(true, 'The dialog is open')
            },
            errorMessage: 'Did not find the dialog control'
          })
        },

        iShouldNotSeeTheHelloDialog: function () {
          return this.waitFor({
            controlType: 'sap.m.App', // dummy, I just want a check function, where I can search the DOM. Probably there is a better way for a NEGATIVE test (NO dialog).
            check: function () {
              return document.querySelectorAll('.sapMDialog').length === 0
            },
            success: function () {
              Opa5.assert.ok(true, 'No dialog is open')
            }
          })
        }
      }
    }
  })
})
