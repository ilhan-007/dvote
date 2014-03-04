var systemLib = require('system');
var ioLib = require('io');

// get method type
var method = request.getMethod();
method = method.toUpperCase();

//get primary keys (one primary key is supported!)
var idParameter = getPrimaryKey();

// retrieve the id as parameter if exist 
var id = xss.escapeSql(request.getParameter(idParameter));
var count = xss.escapeSql(request.getParameter('count'));
var metadata = xss.escapeSql(request.getParameter('metadata'));
var sort = xss.escapeSql(request.getParameter('sort'));
var limit = xss.escapeSql(request.getParameter('limit'));
var offset = xss.escapeSql(request.getParameter('offset'));
var desc = xss.escapeSql(request.getParameter('desc'));

if (limit === null) {
    limit = 100;
}
if (offset === null) {
	offset = 0;
}

if(!hasConflictingParameters()){
    // switch based on method type
    if ((method === 'POST')) {
        // create
        createT_vote();
    } else if ((method === 'GET')) {
        // read
        if (id) {
            readT_voteEntity(id);
        } else if (count !== null) {
            countT_vote();
        } else if (metadata !== null) {
            metadataT_vote();
        } else {
            readT_voteList();
        }
    } else if ((method === 'PUT')) {
        // update
        updateT_vote();    
        
    } else if ((method === 'DELETE')) {
        // delete
        if(isInputParameterValid(idParameter)){
            deleteT_vote(id);
        }
        
    } else {
        makeError(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST, 1, "Invalid HTTP Method");
    }    
}



// flush and close the response
response.getWriter().flush();
response.getWriter().close();

function hasConflictingParameters(){
    if(id !== null && count !== null){
        makeError(javax.servlet.http.HttpServletResponse.SC_EXPECTATION_FAILED, 1, "Precondition failed: conflicting parameters - id, count");
        return true;
    }
    if(id !== null && metadata !== null){
        makeError(javax.servlet.http.HttpServletResponse.SC_EXPECTATION_FAILED, 1, "Precondition failed: conflicting parameters - id, metadata");
        return true;
    }
    return false;
}

function isInputParameterValid(paramName){
    var param = request.getParameter(paramName);
    if(param === null || param === undefined){
        makeError(javax.servlet.http.HttpServletResponse.SC_PRECONDITION_FAILED, 1, "Expected parameter is missing: " + paramName);
        return false;
    }
    return true;
}

// print error
function makeError(httpCode, errCode, errMessage) {
    var body = {'err': {'code': errCode, 'message': errMessage}};
    response.setStatus(httpCode);
    response.setHeader("Content-Type", "application/json");
    response.getWriter().print(JSON.stringify(body));
}

// create entity by parsing JSON object from request body
function createT_vote() {
    var input = ioLib.read(request.getReader());
    var message = JSON.parse(input);
    var connection = datasource.getConnection();
    try {
        var sql = "INSERT INTO T_VOTE (";
        sql += "ID";
        sql += ",";
        sql += "TEAM_ID";
        sql += ",";
        sql += "VOTER";
        sql += ",";
        sql += "VOTE_AT";
        sql += ") VALUES ("; 
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ",";
        sql += "?";
        sql += ")";

        var statement = connection.prepareStatement(sql);
        var i = 0;
        var id = db.getNext('T_VOTE_ID');
        statement.setInt(++i, id);
        statement.setInt(++i, message.team_id);
        statement.setString(++i, message.voter);
        var js_date_vote_at =  new Date(Date.parse(message.vote_at));
        statement.setTimestamp(++i, new java.sql.Timestamp(js_date_vote_at.getTime() + js_date_vote_at.getTimezoneOffset()*60*1000));
        statement.executeUpdate();
        response.getWriter().println(id);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

// read single entity by id and print as JSON object to response
function readT_voteEntity(id) {
    var connection = datasource.getConnection();
    try {
        var result = "";
        var sql = "SELECT * FROM T_VOTE WHERE "+pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        
        var resultSet = statement.executeQuery();
        var value;
        while (resultSet.next()) {
            result = createEntity(resultSet);
        }
        if(result.length === 0){
            makeError(javax.servlet.http.HttpServletResponse.SC_NOT_FOUND, 1, "Record with id: " + id + " does not exist.");
        }
        var text = JSON.stringify(result, null, 2);
        response.getWriter().println(text);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

// read all entities and print them as JSON array to response
function readT_voteList() {
    var connection = datasource.getConnection();
    try {
        var result = [];
        var sql = "SELECT ";
        if (limit !== null && offset !== null) {
            sql += " " + db.createTopAndStart(limit, offset);
        }
        sql += " * FROM T_VOTE";
        if (sort !== null) {
            sql += " ORDER BY " + sort;
        }
        if (sort !== null && desc !== null) {
            sql += " DESC ";
        }
        if (limit !== null && offset !== null) {
            sql += " " + db.createLimitAndOffset(limit, offset);
        }
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        var value;
        while (resultSet.next()) {
            result.push(createEntity(resultSet));
        }
        
        var text = JSON.stringify(result, null, 2);
        response.getWriter().println(text);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet, data) {
    var result = {};
	result.id = resultSet.getInt("ID");
	result.team_id = resultSet.getInt("TEAM_ID");
    result.voter = resultSet.getString("VOTER");
    result.vote_at = new Date(resultSet.getTimestamp("VOTE_AT").getTime() - resultSet.getDate("VOTE_AT").getTimezoneOffset()*60*1000);
    return result;
}

// update entity by id
function updateT_vote() {
    var input = ioLib.read(request.getReader());
    var message = JSON.parse(input);
    var connection = datasource.getConnection();
    try {
        var sql = "UPDATE T_VOTE SET ";
        sql += "TEAM_ID = ?";
        sql += ",";
        sql += "VOTER = ?";
        sql += ",";
        sql += "VOTE_AT = ?";
        sql += " WHERE ID = ?";
        var statement = connection.prepareStatement(sql);
        var i = 0;
        statement.setInt(++i, message.team_id);
        statement.setString(++i, message.voter);
        var js_date_vote_at =  new Date(Date.parse(message.vote_at));
        statement.setTimestamp(++i, new java.sql.Timestamp(js_date_vote_at.getTime() + js_date_vote_at.getTimezoneOffset()*60*1000));
        var id = "";
        id = message.id;
        statement.setInt(++i, id);
        statement.executeUpdate();
        response.getWriter().println(id);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

// delete entity
function deleteT_vote(id) {
    var connection = datasource.getConnection();
    try {
        var sql = "DELETE FROM T_VOTE WHERE "+pkToSQL();
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        var resultSet = statement.executeUpdate();
        response.getWriter().println(id);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

function countT_vote() {
    var count = 0;
    var connection = datasource.getConnection();
    try {
        var statement = connection.createStatement();
        var rs = statement.executeQuery('SELECT COUNT(*) FROM T_VOTE');
        while (rs.next()) {
            count = rs.getInt(1);
        }
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
    response.getWriter().println(count);
}

function metadataT_vote() {
	var entityMetadata = {};
	entityMetadata.name = 't_vote';
	entityMetadata.type = 'object';
	entityMetadata.properties = [];
	
	var propertyid = {};
	propertyid.name = 'id';
	propertyid.type = 'integer';
	propertyid.key = 'true';
	propertyid.required = 'true';
    entityMetadata.properties.push(propertyid);

	var propertyteam_id = {};
	propertyteam_id.name = 'team_id';
	propertyteam_id.type = 'integer';
    entityMetadata.properties.push(propertyteam_id);

	var propertyvoter = {};
	propertyvoter.name = 'voter';
    propertyvoter.type = 'string';
    entityMetadata.properties.push(propertyvoter);

	var propertyvote_at = {};
	propertyvote_at.name = 'vote_at';
    propertyvote_at.type = 'timestamp';
    entityMetadata.properties.push(propertyvote_at);


    response.getWriter().println(JSON.stringify(entityMetadata));
}

function getPrimaryKeys(){
    var result = [];
    var i = 0;
    result[i++] = 'ID';
    if (result === 0) {
        throw new Exception("There is no primary key");
    } else if(result.length > 1) {
        throw new Exception("More than one Primary Key is not supported.");
    }
    return result;
}

function getPrimaryKey(){
	return getPrimaryKeys()[0].toLowerCase();
}

function pkToSQL(){
    var pks = getPrimaryKeys();
    return pks[0] + " = ?";
}