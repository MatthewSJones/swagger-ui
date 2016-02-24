
/*
*  Handle authorization for Json Web Tokens (JWT)
*/

var authType = "oauth2";
var activeScopes = [];
var tokenString = "";
var AUTH_COOKIE_VAL = "tkn-swg-ws";

function handleLogin() {
    /// <summary>
    ///     Handles a user login request for a token
    /// </summary>

    //Check first if an access token is set in the cookie
    if (TryCookieToken()) {
        return;
    }

    UpdateLoginUi();

    // Click event for 'login' button : Gather the scopes the user selected to be processed
    $(".api-popup-authbtn").click(function () {
        $.each($(".api-scopes").find("input:checked").parent().find("span"), function (key, value) {
            if ($(value).html() && $.inArray($(value).html(), activeScopes) === -1) {
                activeScopes.push($(value).html());
            }
        });

        $("#swagger-ui-container").hide();
        $("#message-bar").after("<div id='auth-loading-div' class='swagger-ui-wrap container'>Authorizing....</div>");

        // Make the request for a token from the api
        $.ajax({
            url: window.swaggerUi.api.securityDefinitions[authType].tokenUrl,
            type: "POST",
            data: JSON.stringify({ 'Username': $("#username").val(), "Password": $("#password").val(), "Scopes": activeScopes.join(",") }),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        })
        .done(function (data) {
            onOAuthComplete(data);
            UpdateLoginUi();
        })
        .fail(function (data) {
            alert("fail?");
            $("#message-bar").html("<div class='alert alert-danger'>" + data.data.details + "</div>");
        })
        .always(function () {
            $("#auth-loading-div").remove();
            $("#swagger-ui-container").show();
        });
        
        return;
    });
}

function handleLogout() {
    /// <summary>
    ///     Log out the user by clearing the auth headers and scopes and reseting the visuals for auth
    /// </summary>
    activeScopes = [];
    tokenString = "";
    window.Cookies(AUTH_COOKIE_VAL, undefined);
    UpdateLoginUi();
    window.swaggerUi.api.clientAuthorizations.remove(authType);
    $(".api-ic.ic-on").addClass("ic-off").removeClass("ic-on");
    $(".api-ic.ic-warning").addClass("ic-error").removeClass("ic-warning");
}

function initOAuth() {
    /// <summary>
    ///     Initilize the oauth proccess.
    /// </summary>

    // Make sure a security type is defined to proceed.
    if (!window.swaggerUi.api.securityDefinitions[authType]) {
        console.log("No detcted auth being used");
        return;
    }

    handleLogin();

    $(".api-ic").unbind().click(function(s) {
        $(s.target).hasClass("ic-off") ? alert("Please login to access this end point") : handleLogout();
    });
}

function ScopeRequireMessage() {
    /// <summary>
    ///     Add a 'required scopes' message before the list of required scopes for each end point.
    /// </summary>
    $(".api_information_panel :first-child").prepend("<span class='required-scopes-msg'>Required Scopes : </span>");
}

function onOAuthComplete(token) {
    /// <summary>
    ///     Proccess the token request result
    ///     If the request was successful set up the auth visuals to reflect this and add the token to the auth header
    /// </summary>
    /// <param name="token" type="object">Token object returned from the server</param>
    if (!token || !token.data.Token) {
        if (token.data.error) {
            $("input:checkbox").prop("checked", false);
            alert(token.data.error.details);
        }

        return;
    }

    tokenString = token.data.Token;
    SetAuthHeader();

    //set the cookie
    window.Cookies.set(AUTH_COOKIE_VAL, tokenString, { expires: 600 });
};

function TryCookieToken() {
    /// <summary>
    ///     If a cookie is present, then use the token value from it for access
    /// </summary>
    var tryForToken = window.Cookies.get(AUTH_COOKIE_VAL);

    if (tryForToken) {
        tokenString = tryForToken;
        SetAuthHeader();
        UpdateLoginUi();

        return true;
    }

    console.log("No token found in cookie");
    return false;
}

function SetAuthHeader() {
    /// <summary>
    ///     Set the client header for jwt ( Authorization : Bearer {token} )
    /// </summary>
    if (tokenString === "") {
        alert("Failed to set the authorization header - no access token exists");
    }

    window.swaggerUi.api.clientAuthorizations.add(authType, new window.SwaggerClient.ApiKeyAuthorization("Authorization", "Bearer " + tokenString, "header"));
}

function UpdateLoginUi() {
    /// <summary>
    ///     Updates the interface to if the user should be seeing the login section or the account section
    /// </summary>
    if (tokenString !== "") {
        $.each($(".auth .api-ic .api_information_panel").children(), function(k, child) {
            $(child).find("span").remove();
            if ($(child).html() && $.inArray($(child).html(), activeScopes) > -1) {
                // Set appropriate visuals for access
                $(".access").find(".api-ic.ic-on").addClass("ic-off").removeClass("ic-on");
                $(".auth .api-ic").addClass("ic-warning").removeClass("ic-error");
                return true;
            }
        });

        //Set appropriate visuals for no access
        $(".access").find(".api-ic.ic-off").addClass("ic-on").removeClass("ic-off");
        $(".auth").find(".api-ic").addClass("ic-info").removeClass("ic-warning").removeClass("ic-error");

        $("#user-info-div").remove();
        $("#auth-login").hide();
        $("#account-info").show();
        $("#api_info .info_title").after("<div id='user-info-div'>" +
            "<p><b>Logged in as</b> : mjones</p>" +
            "<p><b>Access Token</b> : " + tokenString + "</p>" +
            "</div>");
        $(".api-logout-btn").unbind().click(function() {
            handleLogout();
        });
    }
    else {
        $("#account-info").hide();
        $("#auth-login").show();
        $("#user-info-div").remove();
    }

    ScopeRequireMessage();
    // Make checkbox options for each scope isDefined by the api 
    $("#available-scopes").html("");
    $.each(window.swaggerUi.api.securityDefinitions[authType].scopes, function (key) {
        $("#available-scopes").append("<label class='checkbox-inline'><input type='checkbox'/><span>" + key + "</span></label>");
    });
}