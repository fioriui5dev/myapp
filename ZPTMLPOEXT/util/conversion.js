/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.util.conversion");
jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");
jQuery.sap.require("sap.ca.ui.model.format.FileSizeFormat");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");
jQuery.sap.require("sap.ca.ui.model.format.FormatHelper");
jQuery.sap.require("sap.ca.ui.model.format.FormattingLibrary");
jQuery.sap.require("sap.ui.core.format.NumberFormat");

ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.util.conversion = {
	CommentsDateFormatter: function(sDate) {
		return ui.s2p.mm.purchorder.approve.util.Conversions.formatDaysAgo(sDate);
	},
	POnotesVisibilityTrigger: function(oNotes) {
		if (oNotes !== null && oNotes !== undefined && oNotes.length !== 0) {
			return true;
		} else {
			return false;
		};
	},
	getReleaseIcon: function(sIcon) {
		if (sIcon === "Approved") {
			return "sap-icon://employee-approvals";
		} else {
			if (sIcon === "Rejected") {
				return "sap-icon://pending"; //"sap-icon://employee-rejections";
			} else {
				return "sap-icon://pending";
			}
		}
	},
	getReleaseText: function(sIcon) {
		if (sIcon === "Approved") {
			return "Approved";
		} else {
			if (sIcon === "Rejected") {
				return "Pending"; //"sap-icon://employee-rejections";
			} else {
				return "Pending";
			}
		}
	}

};