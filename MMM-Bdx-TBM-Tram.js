Module.register("MMM-Bdx-TBM-Tram", {

	// Default module config
	defaults: {
		updateInterval: 60 * 1000,
		animationSpeed: 1000,
		lang: config.language,
		records: 5,
		modus: "past",
		showExtraInfo: false,
		showColumnHeader: false,
		initialLoadDelay: 2500,
		retryDelay: 2500,
        headerText: "Trams",
        nomArretPhysique: "",
        ligneTram: "",
        apiBase: "https://opendata.bordeaux-metropole.fr/api/records/1.0/search/",
        apiBaseArretPhysique: "?dataset=sv_arret_p",
        apiBaseCourseTram: "?dataset=sv_cours_a",
        apiBaseHoraires: "?dataset=sv_horai_a",
		tableClass: "small",
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required stylescripts.
	getStyles: function () {
		return ["MMM-Bdx-TBM-Tram.css"];
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.horairesTramEvents = [];
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;
	},

	// Override dom generator.
	getDom: function () {
		var i = 0;
		var wrapper = document.createElement("div");

		this.config

		var shortDesc = true;
		switch (this.data.position) {
			case "top_bar":
			case "bottom_bar":
			case "middle_center":
				shortDesc = false;;
				break;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var table = document.createElement("table");
		this.className = this.config.tableClass;

		if (this.config.showColumnHeader) {
			table.appendChild(this.getTableHeaderRow());
		}

		console.log(JSON.stringify(this.horairesTramEvents));

		for (var lEventIndex in this.horairesTramEvents.records) {
			console.log("[DEBUG] i = " + i);
			var lEvent = this.horairesTramEvents.records[lEventIndex];

			/* ??? */
			var lPassageEventElmt = document.createElement("tr");
			table.appendChild(lPassageEventElmt);

			/* Logo de la ligne de tram */
			var customerIcon = document.createElement("td");
			customerIcon.innerHTML = "<div class=\"circle_ligne_B\"><span>B</span></div>";
			lPassageEventElmt.appendChild(customerIcon);

			/* Date de l'evenement */
			var lDateElmt = document.createElement("td");
			const lRecvDate = new Date(Date.parse(lEvent.fields.hor_real));
			if(10 > lRecvDate.getMinutes()) {
				lDateElmt.innerHTML = lRecvDate.getHours() + ":0" + lRecvDate.getMinutes();
			} else {
				lDateElmt.innerHTML = lRecvDate.getHours() + ":" + lRecvDate.getMinutes();
			}
			lPassageEventElmt.appendChild(lDateElmt);

			/* Dans N minutes */
			var lTempsElmt = document.createElement("td");
			var lHoursToNextTram = lRecvDate.getHours() - (new Date(Date.now())).getHours();
			var lMinToNextTram = lRecvDate.getMinutes() - (new Date(Date.now())).getMinutes();
			if(0 > lMinToNextTram) {
				lMinToNextTram = lMinToNextTram + 60;
				lHoursToNextTram = lHoursToNextTram - 1;
			}
			lTempsElmt.innerHTML = "";
			if(0 < lHoursToNextTram) {
				lTempsElmt.innerHTML = lHoursToNextTram + "h ";
			}

			if(2 > lMinToNextTram) {
				lMinToNextTram = "Proche";
			} else {
				lMinToNextTram = lMinToNextTram + "min";
			}

			lTempsElmt.innerHTML = lTempsElmt.innerHTML + lMinToNextTram;
			lPassageEventElmt.appendChild(lTempsElmt);

			/* Destination */

			var self = this;
			var retryCourseRequest = true;
			var courseApiRequestURL = this.config.apiBase + this.config.apiBaseCourseTram + "&q=bm_gid=" + lEvent.fields.rs_sv_cours_a;
			console.log("[DEBUG] Course API request URL : " + courseApiRequestURL);

			var courseApiRequest = new XMLHttpRequest();
			courseApiRequest.open("GET", courseApiRequestURL, true);
			courseApiRequest.onreadystatechange = (function(pPassageEventElmt) {
				return function () {
					if (this.readyState === 4) {
						if (this.status === 200) {
							console.log(this.response);
							var destinationID = JSON.parse(this.response).records[0].fields.bm_rs_sv_arret_p_na;
							console.log("[DEBUG] ID arret destination : " + destinationID);

							var retryDestinationRequest = true;
							var destinationApiRequestURL = self.config.apiBase + self.config.apiBaseArretPhysique + "&q=gid=" + destinationID;
							console.log("[DEBUG] Destination API request URL : " + destinationApiRequestURL);

							var destinationApiRequest = new XMLHttpRequest();
							destinationApiRequest.open("GET", destinationApiRequestURL, true);
							destinationApiRequest.onreadystatechange = (function(pPassageEventElmt) {
								return function () {
									if (this.readyState === 4) {
										if (this.status === 200) {
											console.log(this.response);

											var destination = JSON.parse(this.response).records[0].fields.libelle.replace(/\./g, " ");
											console.log("[DEBUG] Libelle arret destination : " + destination);
											console.log("[DEBUG] self.destinationIndex = " + self.destinationIndex)
											console.log("[DEBUG] self = " + self)

											var lDestinationElmt = document.createElement("td");
											lDestinationElmt.innerHTML = destination; /* TODO : Placeholder. Make request for destination */
											pPassageEventElmt.appendChild(lDestinationElmt);
										}
										else if (this.status === 401) {
											self.updateDom(self.config.animationSpeed);
											retryDestinationRequest = true;
										}
										else {
											Log.error(self.name + ": Could not load Bdx OpenData data.");
										}
					
										if (retryDestinationRequest) {
											self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
										}
									}
								}
							})(pPassageEventElmt);
							destinationApiRequest.send();
						}
						else if (this.status === 401) {
							self.updateDom(self.config.animationSpeed);
							retryCourseRequest = true;
						}
						else {
							Log.error(self.name + ": Could not load Bdx OpenData data.");
						}

						if (retryCourseRequest) {
							self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
						}
					}
				}
			})(lPassageEventElmt);
			courseApiRequest.send();
		}

		return table;
	},

	// Override getHeader method.
	getHeader: function () {
		this.data.header = this.config.headerText + " - " + this.config.modus.toUpperCase();
		return this.data.header;
	},

	// Requests new data from Bdx OpenData API.
	updateHorairesTramData: function () {
		var currentDate = new Date(Date.now());
		var endpoint = "";
		var sort = "-hor_real";
		var filter = "rs_sv_arret_p=294 AND hor_real";
		if (this.config.modus === "upcoming") {
			endpoint = "passages/upcoming";
			filter = filter + ">" + currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate() + "T" + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
		} else if (this.config.modus === "past") {
			endpoint = "passages/past";
			filter = filter + "<" + currentDate.getFullYear() + "-" + (currentDate.getMonth() + 1) + "-" + currentDate.getDate() + "T" + currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
		}

		var url = this.config.apiBase + this.config.apiBaseHoraires + "&q=" + filter + "&lang=" + this.lang + "&rows=" + this.config.records + "&sort=" + sort + "&timezone=Europe/Paris";
		var self = this;
		var retry = true;

		var apiRequest = new XMLHttpRequest();
		apiRequest.open("GET", url, true);
		apiRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processHorairesTram(JSON.parse(this.response));
				}
				else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					retry = true;
				}
				else {
					Log.error(self.name + ": Could not load Bdx OpenData data.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		apiRequest.send();
	},

	// processHorairesTram
	processHorairesTram: function (data) {
		this.horairesTramEvents = data;

		this.show(this.config.animationSpeed, { lockString: this.identifier });
		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	// Schedule next update.
	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.updateHorairesTramData();
		}, nextLoad);
	},

	getTableHeaderRow: function () {
		var thDummy = document.createElement("th");
		thDummy.appendChild(document.createTextNode(" "));
		var thHeurePassage = document.createElement("th");
		thHeurePassage.appendChild(document.createTextNode("Heure"));
		var thTempsPassage = document.createElement("th");
		thTempsPassage.appendChild(document.createTextNode("Dans"));
		var thDestination = document.createElement("th");
		thDestination.appendChild(document.createTextNode("Destination"));

		var tHead = document.createElement("thead");
		tHead.appendChild(document.createElement("th"));
		tHead.appendChild(thDummy);
		tHead.appendChild(thHeurePassage);
		tHead.appendChild(thTempsPassage);
		tHead.appendChild(thDestination);

		return tHead;
	},
});
