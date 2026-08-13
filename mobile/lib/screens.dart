import 'package:flutter/material.dart';
import 'api.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onSignedIn});
  final ApiClient api;
  final Future<void> Function(String token) onSignedIn;
  @override State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final user = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool register = false;
  bool busy = false;

  @override
  void dispose() { user.dispose(); email.dispose(); password.dispose(); super.dispose(); }

  Future<void> submit() async {
    final username = user.text.trim();
    if (username.length < 3) return _msg('Username must be at least 3 characters.');
    if (register && !email.text.contains('@')) return _msg('Enter a valid email.');
    if (password.text.length < 8) return _msg('Password must be at least 8 characters.');
    setState(() => busy = true);
    try {
      final result = register
          ? await widget.api.register(username, email.text.trim(), password.text)
          : await widget.api.login(username, password.text);
      await widget.onSignedIn(result['accessToken'].toString());
    } catch (e) { _msg(e.toString()); }
    if (mounted) setState(() => busy = false);
  }

  void _msg(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const Icon(Icons.school_rounded, size: 72),
                const SizedBox(height: 14),
                Text('COLLEGE GEEKS', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Text(register ? 'Create your campus empire.' : 'Build. Battle. Become the top geek.', textAlign: TextAlign.center),
                const SizedBox(height: 30),
                TextField(controller: user, decoration: InputDecoration(labelText: register ? 'Username' : 'Username or email', prefixIcon: const Icon(Icons.person))),
                if (register) ...[
                  const SizedBox(height: 12),
                  TextField(controller: email, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email))),
                ],
                const SizedBox(height: 12),
                TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock))),
                const SizedBox(height: 20),
                FilledButton(onPressed: busy ? null : submit, child: Padding(padding: const EdgeInsets.all(14), child: Text(busy ? 'PLEASE WAIT…' : register ? 'CREATE ACCOUNT' : 'ENTER THE CAMPUS'))),
                TextButton(onPressed: busy ? null : () => setState(() => register = !register), child: Text(register ? 'Already have an account? Login' : 'New here? Create an account')),
              ]),
            ),
          ),
        ),
      );
}

class GameShell extends StatefulWidget {
  const GameShell({super.key, required this.api, required this.onSignOut});
  final ApiClient api;
  final Future<void> Function() onSignOut;
  @override State<GameShell> createState() => _GameShellState();
}

class _GameShellState extends State<GameShell> {
  int index = 0;
  Map<String, dynamic>? player;
  @override void initState() { super.initState(); refresh(); }
  Future<void> refresh() async {
    try {
      final result = await widget.api.me();
      player = result['player'] is Map ? Map<String, dynamic>.from(result['player'] as Map) : null;
      if (mounted) setState(() {});
    } catch (e) { if (mounted) _msg(e.toString()); }
  }
  void _msg(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  @override Widget build(BuildContext context) {
    final pages = [HomePage(player: player, refresh: refresh, signOut: widget.onSignOut), JobsPage(api: widget.api, changed: refresh), TowerPage(api: widget.api, changed: refresh), BattlePage(api: widget.api, changed: refresh)];
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.work_outline), selectedIcon: Icon(Icons.work), label: 'Jobs'),
          NavigationDestination(icon: Icon(Icons.apartment_outlined), selectedIcon: Icon(Icons.apartment), label: 'Tower'),
          NavigationDestination(icon: Icon(Icons.sports_mma_outlined), selectedIcon: Icon(Icons.sports_mma), label: 'PvP'),
        ],
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.player, required this.refresh, required this.signOut});
  final Map<String, dynamic>? player;
  final Future<void> Function() refresh;
  final Future<void> Function() signOut;
  @override Widget build(BuildContext context) {
    final p = player ?? <String, dynamic>{};
    return RefreshIndicator(onRefresh: refresh, child: ListView(padding: const EdgeInsets.all(20), children: [
      Row(children: [Expanded(child: Text('Campus HQ', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800))), IconButton(onPressed: signOut, icon: const Icon(Icons.logout))]),
      Text('Welcome back, ${p['username'] ?? 'Geek'}.', style: Theme.of(context).textTheme.bodyLarge),
      const SizedBox(height: 22),
      Row(children: [Expanded(child: StatCard(Icons.account_balance_wallet, 'CASH', p['cash'])), const SizedBox(width: 10), Expanded(child: StatCard(Icons.bolt, 'ENERGY', p['energy']))]),
      const SizedBox(height: 10),
      Row(children: [Expanded(child: StatCard(Icons.fitness_center, 'POWER', p['power'])), const SizedBox(width: 10), Expanded(child: StatCard(Icons.psychology, 'SMARTNESS', p['smartness']))]),
      const SizedBox(height: 24),
      Text('Your game loop', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 10),
      const LoopCard(Icons.work, 'Work', 'Earn cash from jobs.'),
      const SizedBox(height: 8),
      const LoopCard(Icons.apartment, 'Build', 'Unlock rooms and hire allies.'),
      const SizedBox(height: 8),
      const LoopCard(Icons.sports_mma, 'Battle', 'Use Power or Smartness in PvP.'),
    ]));
  }
}

class JobsPage extends StatefulWidget {
  const JobsPage({super.key, required this.api, required this.changed});
  final ApiClient api; final Future<void> Function() changed;
  @override State<JobsPage> createState() => _JobsPageState();
}
class _JobsPageState extends State<JobsPage> {
  List<dynamic> jobs = []; Map<String, dynamic>? active; bool loading = true;
  @override void initState() { super.initState(); load(); }
  Future<void> load() async {
    if (mounted) setState(() => loading = true);
    try {
      final result = await widget.api.jobs();
      final current = await widget.api.activeJob();
      jobs = result['jobs'] is List ? result['jobs'] as List : [];
      active = current['activeJob'] is Map ? Map<String, dynamic>.from(current['activeJob'] as Map) : null;
    } catch (e) { if (mounted) _msg(e.toString()); }
    if (mounted) setState(() => loading = false);
  }
  void _msg(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  Future<void> start(String id) async { try { await widget.api.startJob(id); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); } }
  Future<void> collect() async { final id = active?['id']?.toString(); if (id == null) return; try { await widget.api.collectJob(id); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); } }
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    Row(children: [Expanded(child: Text('Jobs', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800))), IconButton(onPressed: load, icon: const Icon(Icons.refresh))]),
    if (active != null) Card(child: ListTile(leading: const CircleAvatar(child: Icon(Icons.timer)), title: const Text('Active job'), subtitle: Text('Finishes ${active!['finishesAt'] ?? ''}'), trailing: FilledButton(onPressed: collect, child: const Text('COLLECT')))),
    const SizedBox(height: 16),
    if (loading) const Center(child: CircularProgressIndicator()),
    for (final item in jobs.whereType<Map>()) Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(title: Text('${item['name'] ?? 'Job'}'), subtitle: Text('${item['durationSeconds'] ?? '?'} sec • +${item['rewardCash'] ?? 0} cash'), trailing: FilledButton(onPressed: active == null ? () => start('${item['id']}') : null, child: const Text('START')))),
  ]);
}

class TowerPage extends StatefulWidget {
  const TowerPage({super.key, required this.api, required this.changed});
  final ApiClient api; final Future<void> Function() changed;
  @override State<TowerPage> createState() => _TowerPageState();
}
class _TowerPageState extends State<TowerPage> with SingleTickerProviderStateMixin {
  late final TabController tabs = TabController(length: 2, vsync: this);
  List<dynamic> rooms = []; List<dynamic> allies = []; bool loading = true;
  static const roomCosts = <int, double>{1: 250, 2: 500, 3: 900, 4: 1500};
  @override void initState() { super.initState(); load(); }
  @override void dispose() { tabs.dispose(); super.dispose(); }
  Future<void> load() async {
    if (mounted) setState(() => loading = true);
    try { final t = await widget.api.tower(); final a = await widget.api.allies(); rooms = t['rooms'] is List ? t['rooms'] as List : []; allies = a['allies'] is List ? a['allies'] as List : []; } catch (e) { if (mounted) _msg(e.toString()); }
    if (mounted) setState(() => loading = false);
  }
  void _msg(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  bool unlocked(int n) => rooms.whereType<Map>().any((r) => r['roomNumber'] == n && r['unlocked'] == true);
  Future<void> unlock(int roomNumber) async { try { await widget.api.unlockTowerRoom(roomNumber); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); } }
  Future<void> hire(Map ally) async {
    final available = rooms.whereType<Map>().where((r) => r['unlocked'] == true && ((r['occupants'] as List?) ?? const []).isEmpty).toList();
    if (available.isEmpty) return _msg('Unlock an empty tower room first.');
    try { await widget.api.hireAlly('${ally['id']}', '${available.first['id']}'); await load(); await widget.changed(); } catch (e) { _msg(e.toString()); }
  }
  @override Widget build(BuildContext context) => Column(children: [
    Padding(padding: const EdgeInsets.fromLTRB(20, 20, 12, 8), child: Row(children: [Expanded(child: Text('Tower', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800))), IconButton(onPressed: load, icon: const Icon(Icons.refresh))])),
    TabBar(controller: tabs, tabs: const [Tab(text: 'ROOMS'), Tab(text: 'ALLIES')]),
    Expanded(child: loading ? const Center(child: CircularProgressIndicator()) : TabBarView(controller: tabs, children: [
      ListView(padding: const EdgeInsets.all(20), children: [for (final entry in roomCosts.entries) RoomCard(number: entry.key, cost: entry.value, unlocked: unlocked(entry.key), onUnlock: () => unlock(entry.key))]),
      ListView(padding: const EdgeInsets.all(20), children: [for (final ally in allies.whereType<Map>()) Card(child: ListTile(title: Text('${ally['name']}'), subtitle: Text('${ally['tier']} • +${ally['power']} Power • +${ally['smartness']} Smartness • ${ally['hireCost']} cash'), trailing: FilledButton(onPressed: () => hire(ally), child: const Text('HIRE'))))]),
    ])),
  ]);
}

class RoomCard extends StatelessWidget {
  const RoomCard({super.key, required this.number, required this.cost, required this.unlocked, required this.onUnlock});
  final int number; final double cost; final bool unlocked; final VoidCallback onUnlock;
  @override Widget build(BuildContext context) => Card(margin: const EdgeInsets.only(bottom: 10), child: ListTile(leading: CircleAvatar(child: Text('$number')), title: Text('Room $number'), subtitle: Text(unlocked ? 'Unlocked' : 'Unlock for ${cost.toStringAsFixed(0)} cash'), trailing: unlocked ? const Icon(Icons.check_circle) : FilledButton(onPressed: onUnlock, child: const Text('UNLOCK'))));
}

class BattlePage extends StatefulWidget {
  const BattlePage({super.key, required this.api, required this.changed});
  final ApiClient api; final Future<void> Function() changed;
  @override State<BattlePage> createState() => _BattlePageState();
}
class _BattlePageState extends State<BattlePage> {
  final search = TextEditingController();
  List<dynamic> players = []; String action = 'punch'; bool loading = false; String result = '';
  @override void dispose() { search.dispose(); super.dispose(); }
  Future<void> findPlayers() async { setState(() => loading = true); try { final r = await widget.api.players(search.text.trim()); players = r['players'] is List ? r['players'] as List : []; } catch (e) { _msg(e.toString()); } if (mounted) setState(() => loading = false); }
  Future<void> fight(String defenderId) async { setState(() => loading = true); try { final r = await widget.api.battle(defenderId, action); result = r.toString(); await widget.changed(); } catch (e) { result = e.toString(); } if (mounted) setState(() => loading = false); }
  void _msg(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  @override Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), children: [
    Text('PvP Arena', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
    const SizedBox(height: 8), const Text('Find another geek and spend energy to fight.'), const SizedBox(height: 16),
    TextField(controller: search, onSubmitted: (_) => findPlayers(), decoration: InputDecoration(labelText: 'Search opponent', suffixIcon: IconButton(onPressed: findPlayers, icon: const Icon(Icons.search)))),
    const SizedBox(height: 12), SegmentedButton<String>(segments: const [ButtonSegment(value: 'punch', label: Text('PUNCH')), ButtonSegment(value: 'face_off', label: Text('FACE-OFF'))], selected: {action}, onSelectionChanged: (value) => setState(() => action = value.first)),
    const SizedBox(height: 16), if (loading) const LinearProgressIndicator(),
    for (final player in players.whereType<Map>()) Card(child: ListTile(title: Text('${player['username']}'), subtitle: Text('Power ${player['power']} • Smartness ${player['smartness']}'), trailing: FilledButton(onPressed: loading ? null : () => fight('${player['id']}'), child: const Text('FIGHT')))),
    if (result.isNotEmpty) Card(child: Padding(padding: const EdgeInsets.all(16), child: SelectableText(result))),
  ]);
}

class StatCard extends StatelessWidget {
  const StatCard(this.icon, this.label, this.value, {super.key});
  final IconData icon; final String label; final dynamic value;
  @override Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(15), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon), const SizedBox(height: 10), Text(label, style: Theme.of(context).textTheme.labelSmall), Text('${value ?? 0}', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900))])));
}

class LoopCard extends StatelessWidget {
  const LoopCard(this.icon, this.title, this.subtitle, {super.key});
  final IconData icon; final String title; final String subtitle;
  @override Widget build(BuildContext context) => Card(child: ListTile(leading: CircleAvatar(child: Icon(icon)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(subtitle)));
}
