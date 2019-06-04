define("CasePage", ["CasePageResources", "css!CasePageSelectCaseOwnerCss"],
	function() {
		return {
			entitySchemaName: "Case",
			details: /**SCHEMA_DETAILS*/{}/**SCHEMA_DETAILS*/,
			attributes: {
				"IsAssigneeIconVisible": {
					dataValueType: Terrasoft.DataValueType.BOOLEAN,
					value: false
				},
				"AssigneeIconTipText": {
					"dataValueType": Terrasoft.DataValueType.TEXT,
					"value": ""
				},
				"IsAssigneeIconTipVisible": {
					dataValueType: Terrasoft.DataValueType.BOOLEAN,
					value: false
				},
				"Owner": {
					dependencies: [
						{
							columns: ["Group", "SupportLevel"],
							methodName: "setOwner"
						}
					]
				},
				"SupportLevel": {
					dependencies: [
						{
							columns: ["Owner"],
							methodName: "clearAssigneeTip"
						}
					]
				}
			},
			modules: /**SCHEMA_MODULES*/{}/**SCHEMA_MODULES*/,
		dataModels: /**SCHEMA_DATA_MODELS*/{}/**SCHEMA_DATA_MODELS*/,
		diff: /**SCHEMA_DIFF*/[
			{
				"operation": "move",
				"name": "SupportLevel",
				"values": {
					"layout": {
						"colSpan": 24,
						"rowSpan": 1,
						"column": 0,
						"row": 8,
						"layoutName": "ProfileContainer"
					},
					"bindTo": "SupportLevel",
					"enabled": true,
					"contentType": 3
				},
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"index": 10
			},
			{
				"operation": "merge",
				"name": "CaseGroup",
				"values": {
					"layout": {
						"column": 0,
						"row": 9,
						"colSpan": 24,
						"rowSpan": 1
					}
				}
			},
			{
				"operation": "merge",
				"name": "CaseOwner",
				"values": {
					"layout": {
						"column": 0,
						"row": 10,
						"colSpan": 24,
						"rowSpan": 1
					}
				}
			},
			{
				"operation": "merge",
				"name": "CaseAssignToMeButton",
				"values": {
					"layout": {
						"column": 0,
						"row": 11,
						"colSpan": 24,
						"rowSpan": 1
					}
				}
			},
			{
				"operation": "insert",
				"name": "AssigneeTipButton",
				"parentName": "ProfileContainer",
				"propertyName": "items",
				"values": {
					"markerValue": "AssigneeTipButton",
					"itemType": 21,
					"controlConfig": {
						"classes": {
							"wrapperClass": [
								"assignee-tip-button"
							]
						},
						"visible": {
							"bindTo": "IsAssigneeIconVisible"
						}
					},
					"items": [],
					"layout": {
						"row": 10,
						"column": 23,
						"colSpan": 4
					},
					"tips": [
						{
							"content": {
								"bindTo": "AssigneeIconTipText"
							},
							"visible": {
								"bindTo": "IsAssigneeIconTipVisible"
							},
							"behaviour": {
								"displayEvent": 2
							},
							"displayMode": "narrow",
							"hideOnScroll": false
						}
					]
				},
				"index": 1
			}
		]/**SCHEMA_DIFF*/,
			methods: {

				/**
				 * Set up message to show in Assignee tip.
				 * @param {String|null} message Message to show or null to hide tip.
				 * @param {Boolean} visibilityState State of tip message visibility.
				 */
				setAssigneeTipMessage: function(message, visibilityState) {
					if (!message) {
						this.set("IsAssigneeIconVisible", false);
						this.set("IsAssigneeIconTipVisible", false);
					} else {
						this.set("AssigneeIconTipText", message);
						this.set("IsAssigneeIconVisible", true);
						this.set("IsAssigneeIconTipVisible", visibilityState || false);
					}
				},

				/**
				 * Hide assignee tip and button.
				 */
				clearAssigneeTip: function() {
					this.setAssigneeTipMessage();
				},

				/**
				 * Dependency handler to set up Owner.
				 */
				setOwner: function() {
					var selectedSupportLevelId = this.get("SupportLevel") && this.get("SupportLevel").value;
					if (!selectedSupportLevelId) {
						return;
					}
					this.trySetPreviousOwner();
				},

				/**
				 * Try to set owner from case lifecycle at current line.
				 */
				trySetPreviousOwner: function() {
					this.clearAssigneeTip();
					var selectedSupportLevelId = this.get("SupportLevel").value;
					var esq = this._getPreviousOwnerEsq(selectedSupportLevelId);
					esq.getEntityCollection(function(response) {
						if (response.success && !response.collection.isEmpty()) {
							var lastLifecycleRecord = response.collection.first();
							this.set("Owner", lastLifecycleRecord.get("Owner"));
							this.setAssigneeTipMessage(this.get("Resources.Strings.PreviousAssigneeText"), false);
						} else {
							this.set("Owner", null);
							this.setAssigneeTipMessage(this.get("Resources.Strings.NeedToSetAssigneeText"), true);
						}
					}, this);
				},

				_getPreviousOwnerEsq: function(selectedSupportLevelId) {
					var esq = this.Ext.create("Terrasoft.EntitySchemaQuery", {
						rootSchemaName: "CaseLifecycle"
					});
					esq.addColumn("Owner");
					esq.filters.add("CaseFilter", this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.EQUAL, "Case", this.get("Id")));
					esq.filters.add("SupportLevelFilter", this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.EQUAL, "SupportLevel", selectedSupportLevelId));
					esq.filters.add("UserActiveFilter", this.Terrasoft.createColumnFilterWithParameter(
						this.Terrasoft.ComparisonType.EQUAL, "[SysAdminUnit:Contact:Owner].Active", 1));
					esq.filters.add("ownerNotNullFilter", this.Terrasoft.createColumnIsNotNullFilter("Owner"));
					var sortedSelectColumn = esq.addColumn("StartDate");
					sortedSelectColumn.orderPosition = 0;
					sortedSelectColumn.orderDirection = Terrasoft.OrderDirection.DESC;
					return esq;
				}

			},
			rules: {}
		};
	});
