import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException(this.message, this.statusCode);
  final String message;
  final int statusCode;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({this.baseUrl = 'http://localhost:3000', http.Client? client})
      : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;
  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    late http.Response response;
    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'GET':
        response = await _client.get(uri, headers: _headers);
      case 'POST':
        response = await _client.post(uri, headers: _headers, body: encoded);
      default:
        throw StateError('Unsupported HTTP method');
    }

    dynamic decoded;
    try {
      decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    } catch (_) {
      decoded = <String, dynamic>{'message': response.body};
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map && decoded['message'] != null
          ? decoded['message'].toString()
          : 'Request failed (${response.statusCode})';
      throw ApiException(message, response.statusCode);
    }
    return decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
  }

  Future<Map<String, dynamic>> register(String username, String email, String password) =>
      _request('POST', '/auth/register', body: {
        'username': username,
        'email': email,
        'password': password,
      });

  Future<Map<String, dynamic>> login(String login, String password) =>
      _request('POST', '/auth/login', body: {
        'login': login,
        'password': password,
      });

  Future<Map<String, dynamic>> me() => _request('GET', '/me');
  Future<Map<String, dynamic>> jobs() => _request('GET', '/jobs');
  Future<Map<String, dynamic>> activeJob() => _request('GET', '/jobs/active');

  Future<Map<String, dynamic>> startJob(String jobId) =>
      _request('POST', '/jobs/$jobId/start');

  Future<Map<String, dynamic>> collectJob(String activeJobId) =>
      _request('POST', '/jobs/active/$activeJobId/collect');

  Future<Map<String, dynamic>> battle(String defenderId, String action) =>
      _request('POST', '/battles', body: {
        'defenderId': defenderId,
        'action': action,
      });
}
