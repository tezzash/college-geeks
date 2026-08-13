import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'screens.dart';

const apiBaseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');

void main() => runApp(const CollegeGeeksApp());

class CollegeGeeksApp extends StatefulWidget {
  const CollegeGeeksApp({super.key});
  @override
  State<CollegeGeeksApp> createState() => _CollegeGeeksAppState();
}

class _CollegeGeeksAppState extends State<CollegeGeeksApp> {
  final api = ApiClient(baseUrl: apiBaseUrl);
  bool loading = true;
  bool authenticated = false;

  @override
  void initState() { super.initState(); _restore(); }

  Future<void> _restore() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    if (token != null) {
      api.token = token;
      try { await api.me(); authenticated = true; } catch (_) { await prefs.remove('accessToken'); api.token = null; }
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> signedIn(String token) async {
    api.token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', token);
    if (mounted) setState(() => authenticated = true);
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    api.token = null;
    if (mounted) setState(() => authenticated = false);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'College Geeks',
    theme: ThemeData(brightness: Brightness.dark, useMaterial3: true, colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF8B5CF6), brightness: Brightness.dark), scaffoldBackgroundColor: const Color(0xFF0B0D14)),
    home: loading ? const Scaffold(body: Center(child: CircularProgressIndicator())) : authenticated ? GameShell(api: api, onSignOut: signOut) : AuthScreen(api: api, onSignedIn: signedIn),
  );
}
