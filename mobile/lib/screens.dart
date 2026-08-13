import 'dart:async';

import 'package:flutter/material.dart';

import 'api.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onSignedIn});

  final ApiClient api;
  final Future<void> Function(String token) onSignedIn;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final user = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  bool register = false;
  bool busy = false;

  @override
  void dispose() {
    user.dispose();
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    final username = user.text.trim();
    if (username.length < 3) {
      _msg('Username must be at least 3 characters.');
      return;
    }
    if (register && !email.text.contains('@')) {
      _msg('Enter a valid email.');
      return;
    }
    if (password.text.length < 8) {
      _msg('Password must be at least 8 characters.');
      return;
    }

    setState(() => busy = true);
    try {
      final result = register
          ? await widget.api.register(username, email.text.trim(), password.text)
          : await widget.api.login(username, password.text);
      await widget.onSignedIn(result['accessToken'].toString());
    } catch (e) {
      _msg(e.toString());
    }
    if (mounted) {
      setState(() => busy = false);
    }
  }

  void _msg(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 430),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: Theme.of(context)
                        .colorScheme
                        .primaryContainer
                        .withValues(alpha: .35),
                  ),
                  child: const Icon(Icons.school_rounded, size: 64),
                ),
                const SizedBox(height: 18),
                Text(
                  'COLLEGE GEEKS',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  register
                      ? 'Create your campus empire.'
                      : 'Build. Battle. Become the top geek.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 30),
                TextField(
                  controller: user,
                  decoration: InputDecoration(
                    labelText: register ? 'Username' : 'Username or email',
                    prefixIcon: const Icon(Icons.person),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
                if (register) ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'Email',
                      prefixIcon: const Icon(Icons.email),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: password,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: busy ? null : submit,
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Text(
                      busy
                          ? 'PLEASE WAIT…'
                          : register
                              ? 'CREATE ACCOUNT'
                              : 'ENTER THE CAMPUS',
                    ),
                  ),
                ),
                TextButton(
                  onPressed: busy
                      ? null
                      : () => setState(() => register = !register),
                  child: Text(
                    register
                        ? 'Already have an account? Login'
                        : 'New here? Create an account',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class GameShell extends StatefulWidget {
  const GameShell({super.key, required this.api, required this.onSignOut});

  final ApiClient api;
  final Future<void> Function() onSignOut;

  @override
  State<GameShell> createState() => _GameShellState();
}

class _GameShellState extends State<GameShell> {
  int index = 0;
  Map<String, dynamic>? player;

  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    try {
      final result = await widget.api.me();
      player = result['player'] is Map
          ? Map<String, dynamic>.from(result['player'] as Map)
          : null;
      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      if (mounted) {
        _msg(e.toString());
      }
    }
  }

  void _msg(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomePage(player: player, refresh: refresh, signOut: widget.onSignOut),
      JobsPage(api: widget.api, changed: refresh),
      TowerPage(api: widget.api, changed: refresh),
      BattlePage(api: widget.api, changed: refresh),
    ];

    return Scaffold(
      body: SafeArea(
        child: IndexedStack(index: index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.work_outline),
            selectedIcon: Icon(Icons.work),
            label: 'Jobs',
          ),
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment),
            label: 'Tower',
          ),
          NavigationDestination(
            icon: Icon(Icons.sports_mma_outlined),
            selectedIcon: Icon(Icons.sports_mma),
            label: 'PvP',
          ),
        ],
      ),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.player,
    required this.refresh,
    required this.signOut,
  });

  final Map<String, dynamic>? player;
  final Future<void> Function() refresh;
  final Future<void> Function() signOut;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Timer? timer;

  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.player ?? <String, dynamic>{};
    final energy = (p['energy'] as num?)?.toInt() ?? 0;
    const maxEnergy = 10;
    final last = DateTime.tryParse('${p['lastEnergyUpdate'] ?? ''}');
    final nextEnergy = energy < maxEnergy && last != null
        ? last.add(const Duration(minutes: 7))
        : null;

    return RefreshIndicator(
      onRefresh: widget.refresh,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Campus HQ',
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w900),
                    ),
                    Text(
                      'Welcome back, ${p['username'] ?? 'Geek'}.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: widget.signOut,
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  Icons.account_balance_wallet,
                  'CASH',
                  '${p['cash'] ?? 0}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(Icons.bolt, 'ENERGY', '$energy / $maxEnergy'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  Icons.fitness_center,
                  'POWER',
                  '${p['power'] ?? 0}',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: StatCard(
                  Icons.psychology,
                  'SMARTNESS',
                  '${p['smartness'] ?? 0}',
                ),
              ),
            ],
          ),
          if (nextEnergy != null) ...[
            const SizedBox(height: 10),
            Card(
              child: ListTile(
                leading: const Icon(Icons.bolt),
                title: const Text('Energy regenerating'),
                subtitle: CountdownText(
                  target: nextEnergy,
                  suffix: ' until +1 energy',
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
          const SectionTitle('Your game loop'),
          const SizedBox(height: 10),
          const LoopCard(Icons.work, 'WORK', 'Earn cash from jobs.'),
          const SizedBox(height: 8),
          const LoopCard(
            Icons.apartment,
            'BUILD',
            'Unlock rooms and hire allies.',
          ),
          const SizedBox(height: 8),
          const LoopCard(
            Icons.sports_mma,
            'BATTLE',
            'Use Power or Smartness in PvP.',
          ),
        ],
      ),
    );
  }
}

class JobsPage extends StatefulWidget {
  const JobsPage({super.key, required this.api, required this.changed});

  final ApiClient api;
  final Future<void> Function() changed;

  @override
  State<JobsPage> createState() => _JobsPageState();
}

class _JobsPageState extends State<JobsPage> {
  List<dynamic> jobs = [];
  Map<String, dynamic>? active;
  bool loading = true;
  Timer? poll;

  @override
  void initState() {
    super.initState();
    load();
    poll = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && active != null) {
        load(silent: true);
      }
    });
  }

  @override
  void dispose() {
    poll?.cancel();
    super.dispose();
  }

  Future<void> load({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() => loading = true);
    }
    try {
      final result = await widget.api.jobs();
      final current = await widget.api.activeJob();
      jobs = result['jobs'] is List ? result['jobs'] as List : [];
      active = current['activeJob'] is Map
          ? Map<String, dynamic>.from(current['activeJob'] as Map)
          : null;
    } catch (e) {
      if (mounted && !silent) {
        _msg(e.toString());
      }
    }
    if (mounted) {
      setState(() => loading = false);
    }
  }

  void _msg(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> start(String id) async {
    try {
      await widget.api.startJob(id);
      await load();
      await widget.changed();
    } catch (e) {
      _msg(e.toString());
    }
  }

  Future<void> collect() async {
    final id = active?['id']?.toString();
    if (id == null) return;
    try {
      await widget.api.collectJob(id);
      await load();
      await widget.changed();
    } catch (e) {
      _msg(e.toString());
    }
  }

  bool _isFinished(Map<String, dynamic> job) {
    final target = DateTime.tryParse('${job['finishesAt']}');
    return target != null && !DateTime.now().isBefore(target);
  }

  double _progress(Map<String, dynamic> job) {
    final start = DateTime.tryParse('${job['startedAt']}');
    final end = DateTime.tryParse('${job['finishesAt']}');
    if (start == null || end == null || end.isBefore(start)) return 0;
    final total = end.difference(start).inMilliseconds;
    final elapsed = DateTime.now().difference(start).inMilliseconds;
    return (elapsed / total).clamp(0.0, 1.0);
  }

  IconData _jobIcon(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('study')) return Icons.menu_book;
    if (lower.contains('night')) return Icons.nightlight;
    return Icons.work;
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Jobs',
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
            ),
            IconButton(onPressed: load, icon: const Icon(Icons.refresh)),
          ],
        ),
        const SizedBox(height: 4),
        const Text('Work now. Get paid when the timer hits zero.'),
        if (active != null) ...[
          const SizedBox(height: 18),
          Card(
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.timer),
                      const SizedBox(width: 10),
                      const Text(
                        'ACTIVE JOB',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                      const Spacer(),
                      CountdownText(
                        target: DateTime.tryParse(
                              '${active!['finishesAt']}',
                            ) ??
                            DateTime.now(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  LinearProgressIndicator(
                    value: _progress(active!),
                    minHeight: 8,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: _isFinished(active!) ? collect : null,
                      icon: const Icon(Icons.payments),
                      label: Text(
                        _isFinished(active!)
                            ? 'COLLECT REWARD'
                            : 'WORKING…',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 18),
        if (loading) const Center(child: CircularProgressIndicator()),
        for (final item in jobs.whereType<Map>())
          Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                child: Icon(_jobIcon('${item['name']}')),
              ),
              title: Text(
                '${item['name'] ?? 'Job'}',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(
                '${item['durationSeconds'] ?? '?'} sec  •  +${item['rewardCash'] ?? 0} cash',
              ),
              trailing: FilledButton(
                onPressed:
                    active == null ? () => start('${item['id']}') : null,
                child: const Text('START'),
              ),
            ),
          ),
      ],
    );
  }
}

class TowerPage extends StatefulWidget {
  const TowerPage({super.key, required this.api, required this.changed});

  final ApiClient api;
  final Future<void> Function() changed;

  @override
  State<TowerPage> createState() => _TowerPageState();
}

class _TowerPageState extends State<TowerPage>
    with SingleTickerProviderStateMixin {
  late final TabController tabs = TabController(length: 2, vsync: this);
  List<dynamic> rooms = [];
  List<dynamic> allies = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    tabs.dispose();
    super.dispose();
  }

  Future<void> load() async {
    if (mounted) setState(() => loading = true);
    try {
      final tower = await widget.api.tower();
      final allyResult = await widget.api.allies();
      rooms = tower['rooms'] is List ? tower['rooms'] as List : [];
      allies = allyResult['allies'] is List
          ? allyResult['allies'] as List
          : [];
    } catch (e) {
      if (mounted) _msg(e.toString());
    }
    if (mounted) setState(() => loading = false);
  }

  void _msg(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Map? room(int number) {
    for (final value in rooms) {
      if (value is Map && value['roomNumber'] == number) return value;
    }
    return null;
  }

  Future<void> unlock(int roomNumber) async {
    try {
      await widget.api.unlockTowerRoom(roomNumber);
      await load();
      await widget.changed();
    } catch (e) {
      _msg(e.toString());
    }
  }

  Future<void> hire(Map ally) async {
    final available = rooms.whereType<Map>().where((room) {
      final occupants = room['occupants'];
      return room['unlocked'] == true &&
          (occupants is List ? occupants.isEmpty : true);
    }).toList();

    if (available.isEmpty) {
      _msg('Unlock an empty tower room first.');
      return;
    }

    try {
      await widget.api.hireAlly(
        '${ally['id']}',
        '${available.first['id']}',
      );
      await load();
      await widget.changed();
    } catch (e) {
      _msg(e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 12, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Tower',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
              ),
              IconButton(onPressed: load, icon: const Icon(Icons.refresh)),
            ],
          ),
        ),
        TabBar(
          controller: tabs,
          tabs: const [Tab(text: 'ROOMS'), Tab(text: 'ALLIES')],
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: tabs,
                  children: [
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        for (int n = 1; n <= 4; n++)
                          RoomCard(
                            number: n,
                            room: room(n),
                            onUnlock: () => unlock(n),
                          ),
                      ],
                    ),
                    ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        for (final ally in allies.whereType<Map>())
                          Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                child: Text(
                                  '${ally['tier'] ?? '?'}'.substring(0, 1),
                                ),
                              ),
                              title: Text(
                                '${ally['name']}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                '${ally['tier']}  •  +${ally['power']} Power / +${ally['smartness']} Smartness  •  ${ally['cost']} cash',
                              ),
                              trailing: FilledButton(
                                onPressed: () => hire(ally),
                                child: const Text('HIRE'),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

class BattlePage extends StatefulWidget {
  const BattlePage({super.key, required this.api, required this.changed});

  final ApiClient api;
  final Future<void> Function() changed;

  @override
  State<BattlePage> createState() => _BattlePageState();
}

class _BattlePageState extends State<BattlePage> {
  final query = TextEditingController();
  List<dynamic> players = [];
  String mode = 'PUNCH';
  Map<String, dynamic>? result;
  bool busy = false;

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  Future<void> search() async {
    try {
      final response = await widget.api.players(query.text.trim());
      players = response['players'] is List ? response['players'] as List : [];
      if (mounted) setState(() {});
    } catch (e) {
      _msg(e.toString());
    }
  }

  Future<void> fight(String defenderId) async {
    if (busy) return;
    setState(() => busy = true);
    try {
      result = await widget.api.battle(defenderId, mode);
      await widget.changed();
    } catch (e) {
      _msg(e.toString());
    }
    if (mounted) setState(() => busy = false);
  }

  void _msg(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'PvP Arena',
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 6),
        const Text('Pick your edge. Spend energy. Take the cash.'),
        const SizedBox(height: 16),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(
              value: 'PUNCH',
              label: Text('PUNCH'),
              icon: Icon(Icons.fitness_center),
            ),
            ButtonSegment(
              value: 'FACE_OFF',
              label: Text('FACE-OFF'),
              icon: Icon(Icons.psychology),
            ),
          ],
          selected: {mode},
          onSelectionChanged:
              busy ? null : (value) => setState(() => mode = value.first),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: query,
          onSubmitted: (_) => search(),
          decoration: InputDecoration(
            labelText: 'Find a rival',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: IconButton(
              onPressed: search,
              icon: const Icon(Icons.arrow_forward),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        const SizedBox(height: 12),
        for (final player in players.whereType<Map>())
          Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  '${player['username'] ?? '?'}'.substring(0, 1).toUpperCase(),
                ),
              ),
              title: Text('${player['username']}'),
              subtitle: Text(
                'Power ${player['power']}  •  Smartness ${player['smartness']}',
              ),
              trailing: FilledButton(
                onPressed: busy
                    ? null
                    : () => fight('${player['id']}'),
                child: const Text('FIGHT'),
              ),
            ),
          ),
        if (busy)
          const Padding(
            padding: EdgeInsets.all(20),
            child: Center(child: CircularProgressIndicator()),
          ),
        if (result != null) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result!['winnerId'] == result!['attackerId']
                        ? 'VICTORY'
                        : 'DEFEAT',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Win probability: ${result!['winProbability'] ?? '—'}',
                  ),
                  if (result!['stolenCash'] != null)
                    Text('Cash stolen: ${result!['stolenCash']}'),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class CountdownText extends StatefulWidget {
  const CountdownText({super.key, required this.target, this.suffix = ''});

  final DateTime target;
  final String suffix;

  @override
  State<CountdownText> createState() => _CountdownTextState();
}

class _CountdownTextState extends State<CountdownText> {
  Timer? timer;

  @override
  void initState() {
    super.initState();
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.target.difference(DateTime.now());
    final seconds = remaining.isNegative ? 0 : remaining.inSeconds;
    final text =
        '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
    return Text('$text${widget.suffix}');
  }
}

class StatCard extends StatelessWidget {
  const StatCard(this.icon, this.label, this.value, {super.key});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    value,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context)
          .textTheme
          .titleMedium
          ?.copyWith(fontWeight: FontWeight.w900),
    );
  }
}

class LoopCard extends StatelessWidget {
  const LoopCard(this.icon, this.title, this.subtitle, {super.key});

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Text(subtitle),
      ),
    );
  }
}

class RoomCard extends StatelessWidget {
  const RoomCard({
    super.key,
    required this.number,
    required this.room,
    required this.onUnlock,
  });

  final int number;
  final Map? room;
  final VoidCallback onUnlock;

  @override
  Widget build(BuildContext context) {
    final unlocked = room?['unlocked'] == true;
    final cost = room?['cost'] ?? '—';
    final occupants = room?['occupants'];
    final occupied = occupants is List && occupants.isNotEmpty;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: CircleAvatar(child: Text('$number')),
        title: Text(
          '${room?['name'] ?? 'Tower Room $number'}',
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Text(
          unlocked
              ? (occupied ? 'Unlocked • Occupied' : 'Unlocked • Empty')
              : 'Locked • $cost cash',
        ),
        trailing: unlocked
            ? const Icon(Icons.check_circle)
            : FilledButton(
                onPressed: room == null ? null : onUnlock,
                child: const Text('UNLOCK'),
              ),
      ),
    );
  }
}
