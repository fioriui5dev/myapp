jQuery.sap.declare("ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.Component");
// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "ui.s2p.mm.purchorder.approve",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/MM_PO_APV" // we use a URL relative to our own component
		// extension application is deployed with customer namespace
});
this.ui.s2p.mm.purchorder.approve.Component.extend("ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.Component", {
	metadata: {
		version: "1.0",
		config: {
			"sap.ca.serviceConfigs": [{
				"name": "GBAPP_POAPPROVAL",
				"serviceUrl": "/sap/opu/odata/sap/ZPTML_PO_EXT_SRV;mo/",
				"isDefault": true,
				"mockedDataSource": "./localService/metadata.xml"
			}],
			"sap.ca.i18Nconfigs": {
				"bundleName": "ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.i18n.i18n"
			}
		},
		customizing: {
			"sap.ui.viewExtensions": {
				"ui.s2p.mm.purchorder.approve.view.S2": {
					"extListItemInfo": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.view.S2_extListItemInfoCustom",
						"type": "XML"
					}
				}
			},
			"sap.ui.viewReplacements": {
				"ui.s2p.mm.purchorder.approve.view.S3": {
					"viewName": "ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.view.S3Custom",
					"type": "XML"
				}
			},
			"sap.ui.controllerExtensions": {
				"ui.s2p.mm.purchorder.approve.view.S3": {
					"controllerName": "ui.s2p.mm.purchorder.approve.MM_PO_APVExtension.view.S3Custom"
				}
			}
		}
	}
});