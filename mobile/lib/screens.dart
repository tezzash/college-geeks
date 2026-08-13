import 'package:flutter/material.dart';
import 'api.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onSignedIn});
  final ApiClient api;
  final Future<void> Function(String) onSignedIn;
  @override State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool register = false, busy = false;
  final user = TextEditingController(), email = TextEditingController(), password = TextEditingController();

  Future<void> submit() async {
    if (password.text.length < 8) { _msg('Password must be at least 8 characters.'); return; }
    setState(() => busy = true);
    try {
      final r = register ? await widget.api.register(user.text.trim(), email.text.trim(), password.text) : await widget.api.login(user.text.trim(), password.text);
      await widget.onSignedIn(r['accessToken'].toString());
    } catch (e) { _msg(e.toString()); }
    finally { if (mounted) setState(() => busy = false); }
  }
  void _msg(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override Widget build(BuildContext context) => Scaffold(body: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 430), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
    const Icon(Icons.school_rounded, size: 72), const SizedBox(height: 14),
    Text('COLLEGE GEEKS', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
    const SizedBox(height: 8), Text(register ? 'Create your campus empire.' : 'Build. Battle. Become the top geek.', textAlign: TextAlign.center),
    const SizedBox(height: 30),
    TextField(controller: user, decoration: InputDecoration(labelText: register ? 'Username' : 'Username or email', prefixIcon: const Icon(Icons.person))),
    if (register) ...[const SizedBox(height: 12), TextField(controller: email, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email)))],
    const SizedBox(height: 12), TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock))),
    const SizedBox(height: 20), FilledButton(onPressed: busy ? null : submit, child: Padding(padding: const EdgeInsets.all(14), child: Text(busy ? 'PLEASE WAIT…' : register ? 'CREATE ACCOUNT' : 'ENTER THE CAMPUS'))),
    TextButton(onPressed: busy ? null : () => setState(() => register = !register), child: Text(register ? 'Already have an account? Login' : 'New here? Create an account')),
  ]))));
}

class GameShell extends StatefulWidget {
  const GameShell({super.key, required this.api, required this.onSignOut});
  final ApiClient api; final Future<void> Function() onSignOut;
  @override State<GameShell> createState() => _GameShellState();
}

class _GameShellState extends State<GameShell> {
  int index = 0; Map<String, dynamic>? player;
  @override void initState() { super.initState(); refresh(); }
  Future<void> refresh() async { try { final r = await widget.api.me(); player = r['player'] is Map ? Map<String, dynamic>.from(r['player']) : r; if (mounted) setState(() {}); } catch (e) { if (mounted) _msg(e.toString()); } }
  void _msg(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override Widget build(BuildContext context) {
    final pages = [HomePage(player: player, refresh: refresh, signOut: widget.onSignOut), JobsPage(api: widget.api, changed: refresh), TowerPage(), BattlePage(api: widget.api, changed: refresh)];
    return Scaffold(body: SafeArea(child: pages[index]), bottomNavigationBar: NavigationBar(selectedIndex: index, onDestinationSelected: (v) => setState(() => index = v), destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.work_outline), selectedIcon: Icon(Icons.work), label: 'Jobs'),
      NavigationDestination(icon: Icon(Icons.apartment_outlined), selectedIcon: Icon(Icons.apartment), label: 'Tower'),
      NavigationDestination(icon: Icon(Icons.sports_mma_outlined), selectedIcon: Icon(Icons.sports_mma), label: 'PvP'),
    ]));
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.player, required this.refresh, required this.signOut});
  final Map<String, dynamic>? player; final Future<void> Function() refresh, signOut;
  @override Widget build(BuildContext context) { final p = player ?? {}; return RefreshIndicator(onRefresh: refresh, child: ListView(padding: const EdgeInsets.all(20), children: [
    Row(children: [Expanded(child: Text('Campus HQ', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800))), IconButton(onPressed: signOut, icon: const Icon(Icons.logout))]),
    Text('Welcome back, ${p['username'] ?? 'Geek'}.', style: Theme.of(context).textTheme.bodyLarge), const SizedBox(height: 22),
    Row(children: [Expanded(child: StatCard(Icons.account_balance_wallet, 'CASH', p['cash'])), const SizedBox(width: 10), Expanded(child: StatCard(Icons.bolt, 'ENERGY', p['energy']))]), const SizedBox(height: 10),
    Row(children: [Expanded(child: StatCard(Icons.fitness_center, 'POWER', p['power'])), const SizedBox(width: 10), Expanded(child: StatCard(Icons.psychology, 'SMARTNESS', p['smartness']))]), const SizedBox(height: 24),
    Text('Your game loop', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)), const SizedBox(height: 10),
    const LoopCard(Icons.work, 'Work', 'Earn cash from jobs.'), const SizedBox(height: 8), const LoopCard(Icons.apartment, 'Build', 'Grow your tower and stats.'), const SizedBox(height: 8), const LoopCard(Icons.sports_mma, 'Battle', 'Use Power or Smartness in PvP.'),
  ])); }
}

class JobsPage extends StatefulWidget { const JobsPage({super.key, required this.api, required this.changed}); final ApiClient api; final Future<void> Function() changed; @override State<JobsPage> createState() => _JobsPageState(); }
class _JobsPageState extends State<JobsPage> {
  List jobs = []; Map<String, dynamic>? active; bool loading = true;
  @override void initState() { super.initState(); load(); }
  Future<void> load() async { setState(() => loading = true); try { final r = await widget.api.jobs(); final a = await widget.api.activeJob(); jobs = r['jobs'] is List ? r['jobs'] : []; active = a['activeJob'] is Map ? Map<String, dynamic>.from(a['activeJob']) : null; } catch (e) { if (mounted) _msg(e.toString()); } finally { if (mounted) setState(() => loading = false); } }
  void _msg(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  Future<void> start(String id) async { try { await widget.api.startJob(id); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); } }
  Future<void> collect() async { final id = active?['id']?.toString(); if (id == null) return; try { await widget.api.collectJob(id); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); } }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [Row(children: [Expanded(child: Text('Jobs', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800))), IconButton(onPressed: load, icon: const Icon(Icons.refresh))]), const SizedBox(height: 16), if (active != null) Card(child: ListTile(leading: const CircleAvatar(child: Icon(Icons.timer)), title: const Text('Active job'), subtitle: Text('Finishes ${active!['finishesAt'] ?? ''}'), trailing: FilledButton(onPressed: collect, child: const Text('COLLECT')))), const SizedBox(height: 16), Text('Available work', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)), const SizedBox(height: 10), if (loading) const Center(child: CircularProgressIndicator()), for (final j in jobs.whereType<Map>()) Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(leading: const CircleAvatar(child: Icon(Icons.work)), title: Text('${j['name'] ?? 'Job'}'), subtitle: Text('${j['durationSeconds'] ?? '?'} sec • +${j['rewardCash'] ?? 0} cash'), trailing: FilledButton(onPressed: active == null ? () => start('${j['id']}') : null, child: const Text('START'))))]);
}

class TowerPage extends StatelessWidget { const TowerPage({super.key}); @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [Text('Tower', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)), const SizedBox(height: 16), const LoopCard(Icons.apartment, 'Your Tower', 'Room purchases and upgrades are next on the client roadmap.'), const SizedBox(height: 8), const LoopCard(Icons.people, 'Allies', 'Hire allies to grow Power and Smartness.')]); }

class BattlePage extends StatefulWidget { const BattlePage({super.key, required this.api, required this.changed}); final ApiClient api; final Future<void> Function() changed; @override State<BattlePage> createState() => _BattlePageState(); }
class _BattlePageState extends State<BattlePage> {
  final defender = TextEditingController(); String action = 'punch', result = ''; bool busy = false;
  Future<void> fight() async { if (defender.text.trim().isEmpty) return; setState(() => busy = true); try { final r = await widget.api.battle(defender.text.trim(), action); result = r.toString(); await widget.changed(); } catch (e) { result = e.toString(); } finally { if (mounted) setState(() => busy = false); } }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [Text('PvP Arena', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)), const SizedBox(height: 8), const Text('Spend energy and fight another geek.'), const SizedBox(height: 20), TextField(controller: defender, decoration: const InputDecoration(labelText: 'Defender player ID', prefixIcon: Icon(Icons.person_search))), const SizedBox(height: 12), SegmentedButton<String>(segments: const [ButtonSegment(value: 'punch', label: Text('PUNCH')), ButtonSegment(value: 'face_off', label: Text('FACE-OFF'))], selected: {action}, onSelectionChanged: (v) => setState(() => action = v.first)), const SizedBox(height: 16), FilledButton.icon(onPressed: busy ? null : fight, icon: const Icon(Icons.sports_mma), label: Text(busy ? 'FIGHTING…' : 'START BATTLE')), if (result.isNotEmpty) ...[const SizedBox(height: 16), Card(child: Padding(padding: const EdgeInsets.all(16), child: SelectableText(result)))] ]);
}

class StatCard extends StatelessWidget { const StatCard(this.icon, this.label, this.value, {super.key}); final IconData icon; final String label; final dynamic value; @override Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(15), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon), const SizedBox(height: 10), Text(label, style: Theme.of(context).textTheme.labelSmall), Text('${value ?? 0}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900))]))); }
class LoopCard extends StatelessWidget { const LoopCard(this.icon, this.title, this.subtitle, {super.key}); final IconData icon; final String title, subtitle; @override Widget build(BuildContext context) => Card(child: ListTile(leading: CircleAvatar(child: Icon(icon)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(subtitle))); }
