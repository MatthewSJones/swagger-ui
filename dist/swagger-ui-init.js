$(function() {
    /// <summary>
    /// Kick off swagger ui
    /// </summary>

    var match = window.location.search.match(/url=([^&]+)/);
    window.swaggerUi =  new SwaggerUi({
        url: match && match.length > 1 ? decodeURIComponent(match[1]) : "http://petstore.swagger.io/v2/swagger.json",
        dom_id: "swagger-ui-container",
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch", "head"],
        onComplete: function() {
            PostBootChanges();          
        },
        onFailure: function() {
            console.log("Unable to Load SwaggerUI");
        },
        docExpansion: "none",
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