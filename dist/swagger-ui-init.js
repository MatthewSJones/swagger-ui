

var HTTP_STATUS_CODES = {
    '200': "OK",
    '201': "Created",
    '202': "Accepted",
    '203': "Non-Authoritative Information",
    '204': "No Content",
    '205': "Reset Content",
    '206': "Partial Content",
    '300': "Multiple Choices",
    '301': "Moved Permanently",
    '302': "Found",
    '303': "See Other",
    '304': "Not Modified",
    '305': "Use Proxy",
    '307': "Temporary Redirect",
    '400': "Bad Request",
    '401': "Unauthorized",
    '402': "Payment Required",
    '403': "Forbidden",
    '404': "Not Found",
    '405': "Method Not Allowed",
    '406': "Not Acceptable",
    '407': "Proxy Authentication Required",
    '408': "Request Timeout",
    '409': "Conflict",
    '410': "Gone",
    '411': "Length Required",
    '412': "Precondition Failed",
    '413': "Request Entity Too Large",
    '414': "Request-URI Too Long",
    '415': "Unsupported Media Type",
    '416': "Requested Range Not Satisfiable",
    '417': "Expectation Failed",
    '500': "Internal Server Error",
    '501': "Not Implemented",
    '502': "Bad Gateway",
    '503': "Service Unavailable",
    '504': "Gateway Timeout",
    '505': "HTTP Version Not Supported"
};


$(function () {
    /// <summary>
    /// Kick off swagger ui
    /// </summary>

    var match = window.location.search.match(/url=([^&]+)/);
    window.swaggerUi =  new SwaggerUi({
        url: match && match.length > 1 ? decodeURIComponent(match[1]) : "http://localhost:5000/swagger/v1/swagger.json", //http://localhost:8080/specs/v2/petstore.json",
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch", "head"],
        onComplete: function() {
            PostBootChanges();          
        },
        onFailure: function() {
            console.log("Unable to Load SwaggerUI");
        },
        docExpansion: "none",
        validatorUrl: false,
        basePath: "https://api.microsemi.com",
        jsonEditor: false,
        apisSorter: "alpha",
        operationsSorter: function (a, b) {
            //Sort by HTTP Method type and also then path alphabetically
            var httpMethodAndPathA = a.method + a.path;
            var httpMethodAndPathB = b.method + b.path;
            return httpMethodAndPathA.localeCompare(httpMethodAndPathB);
        },
        defaultModelRendering: "schema",
        showRequestHeaders: true
    });

    window.swaggerUi.load();
});


function PostBootChanges()
{
    /// <summary>
    /// Stuff to do after swagger ui is loaded
    /// </summary>

    //initialize auth
    if (typeof initOAuth === "function") {
        initOAuth();
    }

    //Show the 'help' tabs at the top info section
    $("#api_info").append(window.Handlebars.templates["panel-info"]);


    //kick off highlight js
    $("pre code").each(function (i, e) {
        window.hljs.highlightBlock(e);
    });

    //Remove extra columns from Response Area of error status codes
    $(".fullwidth tr").each(function () {
        var responseModelCol = 2;
        var headersCol = 3;
        var headerNode = $(this.cells[3]);

        if ($(headerNode).html() === "Headers") {
            $($(headerNode).parent().parent().parent().find("tr")).each(function () {
                this.removeChild(this.cells[headersCol]);
                this.removeChild(this.cells[responseModelCol]);
            });
        }
    });

    //Don't scroll anywhere when a panel is opened.
    $(".panel").click(function (e) {
        e.preventDefault();
    });

    //add bootstrap container class to match width of rest of the page
    $("#api_info").addClass("container");

    //Get rid of swagger ui response type selection
    $(".response-content-type").remove();
}