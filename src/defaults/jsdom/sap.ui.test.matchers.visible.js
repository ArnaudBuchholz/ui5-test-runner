/* Modified version of https://ui5.sap.com/resources/sap/ui/test/matchers/Visible-dbg.js */
/* see https://github.com/jsdom/jsdom/issues/1048 */
/* global sap, jQuery */
sap.ui.define(['sap/ui/test/matchers/Matcher'], function (Matcher) {
  'use strict'

  /**
   * @class Checks if a controls domref is visible.
   * @private
   * @extends sap.ui.test.matchers.Matcher
   * @name sap.ui.test.matchers.Visible
   * @author SAP SE
   * @since 1.34
   */
  return Matcher.extend('sap.ui.test.matchers.Visible', /** @lends sap.ui.test.matchers.Visible.prototype */ {
    isMatching: function (oControl) {
      const oDomRef = oControl.$()

      if (oDomRef.length) {
        const isVisible = ref => ref.css('display') !== 'none' && ref.css('visibility') !== 'hidden'
        if (!isVisible(oDomRef)) {
          this._oLogger.debug("Control '" + oControl + "' is not visible")
          return false
        }
        const parents = oDomRef.parents()
        for (const parent of parents) {
          if (!isVisible(jQuery(parent))) {
            this._oLogger.debug("Control '" + oControl + "' is not visible (because of hidden parent)")
            return false
          }
        }
        return true
      }

      this._oLogger.debug("Control '" + oControl + "'' is not rendered")
      return false
    }
  })
})
