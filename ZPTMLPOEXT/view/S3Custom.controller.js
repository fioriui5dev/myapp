jQuery.sap.require("ui.s2p.mm.purchorder.approve.util.Conversions");
jQuery.sap.require("ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.util.conversion");
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("sap.ca.ui.quickoverview.EmployeeLaunch");
jQuery.sap.require("sap.ca.ui.quickoverview.CompanyLaunch");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.dialog.factory");
sap.ui.controller("ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.view.S3Custom", {
	onInit: function() {
		this.getView().getModel().setSizeLimit(1000000);
		this.resourceBundle = this.oApplicationFacade.getResourceBundle();
		this.oDataModel = this.oApplicationFacade.getODataModel();
		this.oView = this.getView();
		this.oRouter.attachRouteMatched(function(e) {
			if (e.getParameter("name") === "detail") {
				var d = e.getParameter("arguments").contextPath + "/HeaderDetails";
				d = d.replace("WorkflowTaskCollection", "/WorkflowTaskCollection");
				var c = this;
				if (c.sContext !== d || c.sContext === "") {
					this.sContext = d;
					this.refreshScreen(d);
				}
			}
		}, this);
		if (this.extHookOnInit) {
			this.extHookOnInit();
		}
	},
	refreshScreen: function(d) {
		if (d) {
			var v = this.getView();
			v.bindElement(d, {
				expand: "ItemDetails,Notes,Attachments,POComments,PORelease,POHeaderNote,POHeaderText,ItemDetails/Limits"
			});
			if (this.oView.byId("tabBar").getSelectedKey() !== "contentInfo") {
				this.oView.byId("tabBar").setSelectedKey("contentInfo");
			}
			v.getElementBinding().attachEventOnce("dataReceived", this.onDataLoaded, this);
		}
	},
	onDataLoaded: function(e) {
		var t = this;
		var l = {
			oPositiveAction: {
				sI18nBtnTxt: t.resourceBundle.getText("XBUT_APPROVE"),
				onBtnPressed: jQuery.proxy(t.openApproveRejectDialog, t, ["approve"])
			},
			oNegativeAction: {
				sI18nBtnTxt: t.resourceBundle.getText("XBUT_REJECT"),
				onBtnPressed: jQuery.proxy(t.openApproveRejectDialog, t, ["reject"])
			},
			// Forward Button un-commented
			buttonList: [{
				sId: "btn_Forward",
				sI18nBtnTxt: "XBUT_FORWARD",
				onBtnPressed: jQuery.proxy(this.handleForward, t)
			}
			],
			onBack: jQuery.proxy(function() {
				if (sap.ui.Device.system.phone) {
					window.history.go(-1);
				}
			}, this)
		};
		this._updateListItem(e);
		if (this.extHookSetHeaderFooterOptions) {
			l = this.extHookSetHeaderFooterOptions(l);
		}
		this.setHeaderFooterOptions(l);
	},
	navToItemDetails: function(e) {
		var b = e.getSource().getBindingContext().getPath();
		var m = this.getView().getModel();
		this.oRouter.navTo("itemDetails", {
			SAP__Origin: this.oView.getBindingContext().getProperty("SAP__Origin"),
			WorkitemID: this.oView.getBindingContext().getProperty("WorkitemID"),
			PoNumber: this.oView.getBindingContext().getProperty("PoNumber"),
			ItemNumber: m.getProperty(b).ItemNumber
		}, true);
	},
	onAttachment: function(e) {
		ui.s2p.mm.purchorder.approve.util.Conversions.onAttachment(e);
	},
	openApproveRejectDialog: function(a) {
		var C = this.oView.getBindingContext().getProperty("CreatedByID");
		var d = "";
		var D = "";
		var s = "";
		var t = this;
		switch (a[0]) {
			case "approve":
				d = this.resourceBundle.getText("dialog.question.approve", [C]);
				D = this.resourceBundle.getText("XTIT_APPROVAL");
				s = "0001";
				this.sTextKey = "dialog.success.approve";
				break;
			case "reject":
				d = this.resourceBundle.getText("dialog.question.reject", [C]);
				D = this.resourceBundle.getText("XTIT_REJECT");
				s = "0002";
				this.sTextKey = "dialog.success.reject";
				break;
			default:
				break;
		}
		new sap.m.Dialog(this.createId("s3ApproveRejectDialog"), {
			title: D,
			showHeader: true,
			content: [new sap.ui.layout.VerticalLayout({
				width: "100%",
				content: [
					new sap.m.Text(this.createId("S3ConfirmRejectDialogTextField"), {
						text: d
					}).addStyleClass("sapUiSmallMarginBottom"),
					new sap.m.TextArea(this.createId("S3ConfirmRejectDialogTextFieldForNotes"), {
						maxLength: 0,
						width: "100%",
						placeholder: this.resourceBundle.getText("dialog.ApproveRejectForward.NotePlaceHolder"),
						editable: true
					})
				]
			})],
			beginButton: new sap.m.Button({
				text: this.resourceBundle.getText("XBUT_OK"),
				press: function() {
					var n = t.byId("S3ConfirmRejectDialogTextFieldForNotes").getValue();
					var r = {
						isConfirmed: true,
						sNote: n
					};
					t.handleApproveRejectExecute(r, s);
					t.byId("s3ApproveRejectDialog").close();
				}
			}),
			endButton: new sap.m.Button({
				text: this.resourceBundle.getText("XBUT_CANCEL"),
				press: function() {
					t.byId("s3ApproveRejectDialog").close();
				}
			}),
			afterClose: function(e) {
				this.destroy();
			}
		}).addStyleClass("sapUiPopupWithPadding").open();
	},
	handleApproveRejectExecute: function(r, d) {
		var D = this.oView.getModel().getProperty(this.oView.getBindingContext().getPath());
		var c;
		if (r.sNote) {
			c = r.sNote;
		} else {
			c = "";
		}
		this.oDataModel.setRefreshAfterChange(false);
		this.oDataModel.callFunction("ApplyDecision", "POST", {
			SAP__Origin: D.SAP__Origin,
			WorkitemID: D.WorkitemID,
			DecisionKey: d,
			Comment: c
		}, undefined, jQuery.proxy(this._handleApproveRejectSuccess, this), jQuery.proxy(this._handleApproveRejectForwardFail, this));
	},
	_handleApproveRejectSuccess: function(s) {
		var S = "";
		if (s) {
			if (s.ApplyDecision.ActionSuccessful !== "X") {
				var m = this.resourceBundle.getText("dialog.refreshMasterListManually");
				var d = null;
				sap.ca.ui.message.showMessageBox({
					type: sap.ca.ui.message.Type.INFO,
					message: m,
					details: d
				});
			} else {
				S = this.resourceBundle.getText(this.sTextKey);
				var c = sap.ui.core.Component.getOwnerIdFor(this.oView),
					C = sap.ui.component(c);
				var a = {
					bMessageToast: true,
					sMessage: S
				};
				C.oEventBus.publish("ui.s2p.mm.purchorder.approve", "selectNextWorkItem", a);
				this.oDataModel.setRefreshAfterChange(true);
			}
		}
	},
	_handleApproveRejectForwardFail: function(e) {
		this.oDataModel.setRefreshAfterChange(true);
		if (this.oDataModel.hasPendingChanges()) {
			this.oDataModel.refresh(true);
		}
		this._onRequestFailed(e);
	},
	handleForward: function(e) {
		var t = this;
		var d = this.getView().getModel().getProperty(this.getView().getBindingContext().getPath());
		var o = d.SAP__Origin;
		var w = d.WorkitemID;
		var s = function(q) {
			var f = "$filter=" + encodeURIComponent("SearchForText eq '" + q + "' and SAP__Origin eq '" + o + "'");
			t.oDataModel.read("/ForwardingAgentCollection", null, [f], true, function(D, r) {
				sap.ca.ui.dialog.forwarding.setFoundAgents(D.results);
			}, jQuery.proxy(t._onRequestFailed, this));
		};
		var c = function(r) {
			if (r && r.bConfirmed) {
				var S = r.oAgentToBeForwarded;
				var a = t.resourceBundle.getText("dialog.success.forward", [S.FullName]);
				var C = "";
				if (r.sNote) {
					C = r.sNote;
				}
				t.oDataModel.setRefreshAfterChange(false);
				t.oDataModel.callFunction("Forward", "POST", {
					SAP__Origin: o,
					WorkitemID: w,
					NewApprover: S.UserId,
					Comment: C
				}, undefined, function() {
					var b = sap.ui.core.Component.getOwnerIdFor(t.oView),
						f = sap.ui.component(b);
					sap.ca.ui.message.showMessageBox({
						type: sap.ca.ui.message.Type.SUCCESS,
						message: a,
						details: a
					}, function() {
						t.oView.unbindElement();
						f.oEventBus.publish("ui.s2p.mm.purchorder.approve", "selectNextWorkItem");
						t.oDataModel.setRefreshAfterChange(true);
					});
				}, jQuery.proxy(t._handleApproveRejectForwardFail, t));
			}
		};
		sap.ca.ui.dialog.forwarding.start(s, c);
	},
	onViewPDFPreview: function(e) {
		sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
			target: {
				semanticObject: "PDF",
				action: "display"
			},
			 params : {
                          "Type" : "Purchase Order",
                          "Pdfkey": this.getView().byId("invisibleponumber").getProperty("text") //this.getView().byId("invisibleponumber").mProperties["text"]
                }
		});
	},
	onNamePress: function(e) {
		this.openEmployeeLaunch(e, "CreatedByID");
	},
	onForwardedPress: function(e) {
		this.openEmployeeLaunch(e, "ForwardedByID");
	},
	onSubstitutingPress: function(e) {
		this.openEmployeeLaunch(e, "SubstitutingForID");
	},
	onAgentPress: function(e) {
		this.openEmployeeLaunch(e, "CreatedByID");
	},
	onNoteSenderPress: function(e) {
		this.openEmployeeLaunch(e, "CreatedByID");
	},
	onCommentsSenderPress: function(e) {
		this.openEmployeeLaunch(e, "Uname");
	},

	onApproverPress: function(e) {
		this.openEmployeeLaunch(e, "Stext");
	},

	openEmployeeLaunch: function(e, r) {
		var c = e.getSource();
		var t = this.resourceBundle.getText("BussinessCard.Employee");
		var o = function(d) {
			var a = d.results[0],
				E = {
					title: t,
					name: a.FullName,
					imgurl: ui.s2p.mm.purchorder.approve.util.Conversions.businessCardImg(a.Mime_Type, a.__metadata.media_src),
					department: a.Department,
					contactmobile: a.MobilePhone,
					contactphone: a.WorkPhone,
					contactemail: a.EMail,
					companyname: a.CompanyName,
					companyaddress: a.AddressString
				},
				b = new sap.ca.ui.quickoverview.EmployeeLaunch(E);
			b.openBy(c);
		};
		var O = e.getSource().getBindingContext().getProperty("SAP__Origin");
		var u = e.getSource().getBindingContext().getProperty(r);
		var f = "$filter=" + encodeURIComponent("UserID eq '" + u + "' and SAP__Origin eq '" + O + "'");
		this.oDataModel.read("UserDetailsCollection", null, [f], true, jQuery.proxy(o, this), jQuery.proxy(this._onRequestFailed, this));
	},
	onVendorPress: function(e) {
		this.onCompanyLaunch(e, "SupplierID");
	},
	onCompanyLaunch: function(e, r) {
		var t = this.oApplicationFacade.getResourceBundle().getText("BussinessCard.Supplier");
		var s = this.oApplicationFacade.getODataModel().getProperty("SupplierID", this.getView().getBindingContext());
		var c = e.getParameters().domRef;
		var o = this.oView.getBindingContext().getProperty("SAP__Origin");
		var a = this.oApplicationFacade;
		var S = "SupplierDetailCollection(SupplierID='" + s + "',SAP__Origin='" + o + "')";
		var p = ["$expand=SupplierContacts"];
		sap.ca.ui.utils.busydialog.requireBusyDialog();
		a.getODataModel().read(S, null, p, true, function(d, b) {
			sap.ca.ui.utils.busydialog.releaseBusyDialog();
			var h = d.SupplierContacts && d.SupplierContacts.results.length > 0;
			var f = {
				title: t,
				imgurl: ui.s2p.mm.purchorder.approve.util.Conversions.businessCardImg(d.Mime_Type, d.__metadata.media_src),
				companyname: d.SupplierName,
				companyphone: d.WorkPhone,
				companyaddress: d.AddressString,
				maincontactname: h ? d.SupplierContacts.results[0].ContactName : "",
				maincontactmobile: h ? d.SupplierContacts.results[0].MobilePhone : d.WorkPhone,
				maincontactphone: h ? d.SupplierContacts.results[0].WorkPhone : d.WorkPhone,
				maincontactemail: h ? d.SupplierContacts.results[0].EMail : d.EMail
			};
			var g = new sap.ca.ui.quickoverview.CompanyLaunch(f);
			g.openBy(c);
		}, function(E) {
			sap.ca.ui.utils.busydialog.releaseBusyDialog();
		});
	},
	_onRequestFailed: function(e) {
		var t = this;
		var m = "";
		var d = null;
		if (e.response && e.response.body != "" && (e.response.statusCode == "400" || e.response.statusCode == "500")) {
			var M = JSON.parse(e.response.body);
			m = M.error.message.value;
		}
		if (m == "") {
			m = e.message;
			d = e.response.body;
		}
		sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: m,
			details: d
		}, function() {
			var c = sap.ui.core.Component.getOwnerIdFor(t.oView),
				C = sap.ui.component(c);
			C.oEventBus.publish("ui.s2p.mm.purchorder.approve", "selectNextWorkItem");
		});
	},
	isMainScreen: function() {
		return true;
	},
	onExit: function() {
		if (sap.m.InstanceManager.hasOpenPopover()) {
			sap.m.InstanceManager.closeAllPopovers();
		}
		if (sap.m.InstanceManager.hasOpenDialog()) {
			sap.m.InstanceManager.closeAllDialogs();
		}
	},
	POstatus: function(POstatus) {
		if (POstatus === "Approved") {
			return new sap.ui.core.IconPool.getIconURI("sap-icon://accept");
		} else {
			return new sap.ui.core.IconPool.getIconURI("sap-icon://decline");
		}
	},
	_updateListItem: function(e) {
		var m = e.getSource().getModel();
		if (!m) {
			return false;
		}
		var l = this.sContext.replace("/WorkflowTaskCollection", "WorkflowTaskCollection");
		l = l.replace("/HeaderDetails", "");
		var c = "HeaderDetailCollection(";
		if (m.oData[l].SAP__Origin) {
			c = c + "SAP__Origin='" + m.oData[l].SAP__Origin + "',PoNumber=";
		}
		c = c + "'" + m.oData[l].PoNumber + "')";
		if (!m.oData[l] || !m.oData[c]) {
			return false;
		}
		m.oData[l].CreatedByID = m.oData[c].CreatedByID;
		m.oData[l].CreatedByName = m.oData[c].CreatedByName;
		m.oData[l].Currency = m.oData[c].Currency;
		m.oData[l].ForwardedByID = m.oData[c].ForwardedByID;
		m.oData[l].ForwardedByName = m.oData[c].ForwardedByName;
		m.oData[l].WiCreatedAt = m.oData[c].WiCreatedAt;
		m.oData[l].Value = m.oData[c].Value;
	}
});