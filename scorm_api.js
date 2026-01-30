/* scorm_api.js - Simple SCORM 1.2 API Wrapper */
var scorm = {
    connection: null,

    init: function () {
        var api = this.getAPI();
        if (api) {
            this.connection = api;
            var status = api.LMSInitialize("");
            if (status === "true") {
                console.log("SCORM Initialized");
                api.LMSSetValue("cmi.core.lesson_status", "incomplete");
                api.LMSCommit("");
            }
        } else {
            console.error("SCORM API not found");
        }
    },

    getAPI: function () {
        var win = window;
        while ((win.API == null) && (win.parent != null) && (win.parent !== win)) {
            win = win.parent;
        }
        return win.API || null;
    },

    isConnected: function () {
        return !!this.connection;
    },

    setScore: function (score) {
        if (this.connection) {
            this.connection.LMSSetValue("cmi.core.score.raw", score);
            var status = (score >= 60) ? "passed" : "failed";
            this.connection.LMSSetValue("cmi.core.lesson_status", status);
            this.connection.LMSCommit("");
            console.log("Score sent:", score);
        }
    },

    set: function (key, value) {
        if (this.connection) {
            this.connection.LMSSetValue(key, value);
        }
    },

    save: function () {
        if (this.connection) {
            this.connection.LMSCommit("");
        }
    },

    quit: function () {
        if (this.connection) {
            this.connection.LMSFinish("");
            console.log("SCORM Finished");
        }
    }
};
