/**
 * App Templates - React Native / Expo templates
 * 
 * ALL mobile apps MUST use these templates. AI only fills in content.
 */

export type AppTemplateType = 
  | 'social'
  | 'ecommerce'
  | 'fitness'
  | 'productivity'
  | 'media'
  | 'finance'
  | 'food'
  | 'travel'
  | 'education'
  | 'utility';

export interface AppData {
  name: string;
  description: string;
  screens?: Array<{ name: string; components: string[] }>;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
  };
  features?: Array<{ title: string; description: string; icon?: string }>;
  year: number;
}

/**
 * Detect the best app template type from user message
 */
export function detectAppTemplate(message: string): AppTemplateType {
  const lower = message.toLowerCase();
  
  const patterns: Array<{ type: AppTemplateType; keywords: string[] }> = [
    { type: 'social', keywords: ['social', 'chat', 'messaging', 'community', 'network', 'friends'] },
    { type: 'ecommerce', keywords: ['shop', 'store', 'ecommerce', 'buy', 'sell', 'cart', 'marketplace'] },
    { type: 'fitness', keywords: ['fitness', 'workout', 'gym', 'health', 'exercise', 'training', 'yoga'] },
    { type: 'productivity', keywords: ['todo', 'task', 'productivity', 'notes', 'calendar', 'reminder'] },
    { type: 'media', keywords: ['music', 'video', 'podcast', 'streaming', 'media', 'player'] },
    { type: 'finance', keywords: ['finance', 'banking', 'money', 'budget', 'expense', 'investment'] },
    { type: 'food', keywords: ['food', 'restaurant', 'delivery', 'recipe', 'cooking', 'menu'] },
    { type: 'travel', keywords: ['travel', 'booking', 'hotel', 'flight', 'trip', 'vacation'] },
    { type: 'education', keywords: ['education', 'learning', 'course', 'quiz', 'study', 'school'] },
    { type: 'utility', keywords: ['utility', 'tool', 'calculator', 'converter', 'scanner'] },
  ];
  
  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => lower.includes(keyword))) {
      return pattern.type;
    }
  }
  
  return 'utility';
}

/**
 * Generate a React Native / Expo app from template
 */
export function generateApp(type: AppTemplateType, data: AppData): string {
  const primaryColor = data.theme?.primaryColor || '#6366f1';
  const accentColor = data.theme?.accentColor || '#8b5cf6';
  const bgColor = data.theme?.backgroundColor || '#ffffff';
  
  return `import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  FlatList
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ============================================
// THEME & CONSTANTS
// ============================================

const theme = {
  colors: {
    primary: '${primaryColor}',
    accent: '${accentColor}',
    background: '${bgColor}',
    surface: '#ffffff',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' },
  },
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

const Button = ({ title, onPress, variant = 'primary', size = 'md', style }) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    size === 'sm' && styles.buttonSm,
    size === 'lg' && styles.buttonLg,
    style,
  ];
  
  const textStyles = [
    styles.buttonText,
    variant === 'outline' && styles.buttonTextOutline,
  ];
  
  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress} activeOpacity={0.8}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Header = ({ title, subtitle, showBack, onBack }) => (
  <View style={styles.header}>
    {showBack && (
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    )}
    <View style={styles.headerContent}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const Input = ({ placeholder, value, onChangeText, secureTextEntry, icon }) => (
  <View style={styles.inputContainer}>
    {icon && <Text style={styles.inputIcon}>{icon}</Text>}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      placeholderTextColor={theme.colors.textLight}
    />
  </View>
);

const ListItem = ({ title, subtitle, icon, onPress, trailing }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7}>
    {icon && <View style={styles.listItemIcon}><Text style={styles.listItemIconText}>{icon}</Text></View>}
    <View style={styles.listItemContent}>
      <Text style={styles.listItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
    </View>
    {trailing || <Text style={styles.listItemArrow}>→</Text>}
  </TouchableOpacity>
);

const Badge = ({ text, variant = 'primary' }) => (
  <View style={[styles.badge, variant === 'success' && styles.badgeSuccess]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

// ============================================
// SCREENS
// ============================================

${generateScreens(type, data)}

// ============================================
// NAVIGATION
// ============================================

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textLight,
      tabBarLabelStyle: styles.tabBarLabel,
    }}
  >
    ${generateTabScreens(type)}
  </Tab.Navigator>
);

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Detail" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    marginTop: theme.spacing.xs,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  
  // Buttons
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.border,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonSm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  buttonLg: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonTextOutline: {
    color: theme.colors.primary,
  },
  
  // Cards
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Inputs
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  
  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: \`\${theme.colors.primary}15\`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  listItemIconText: {
    fontSize: 20,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  listItemSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  listItemArrow: {
    fontSize: 18,
    color: theme.colors.textLight,
  },
  
  // Badge
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.success,
  },
  badgeText: {
    ...theme.typography.small,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Tab Bar
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    height: 65,
  },
  tabBarLabel: {
    ...theme.typography.small,
    fontWeight: '500',
  },
  
  // Feature Cards
  featureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: \`\${theme.colors.primary}15\`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  featureIconText: {
    fontSize: 28,
  },
  featureTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    lineHeight: 24,
  },
  
  // Hero Section
  hero: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  heroTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

// © ${data.year} ${data.name}. All rights reserved.
`;
}

function generateScreens(type: AppTemplateType, data: AppData): string {
  // Generate type-specific screens
  const screens: Record<AppTemplateType, string> = {
    social: `
const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([
    { id: 1, user: 'Alex', content: 'Just launched my new project! 🚀', likes: 42, time: '2h ago' },
    { id: 2, user: 'Sarah', content: 'Beautiful sunset today 🌅', likes: 128, time: '4h ago' },
    { id: 3, user: 'Mike', content: 'Working on something exciting...', likes: 23, time: '6h ago' },
  ]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="Your Feed" />
      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.scrollContent}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.listItemIcon, { marginRight: 12 }]}>
                <Text style={styles.listItemIconText}>{item.user[0]}</Text>
              </View>
              <View>
                <Text style={styles.listItemTitle}>{item.user}</Text>
                <Text style={styles.listItemSubtitle}>{item.time}</Text>
              </View>
            </View>
            <Text style={{ ...theme.typography.body, marginBottom: 12 }}>{item.content}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 4 }}>❤️</Text>
                <Text style={styles.listItemSubtitle}>{item.likes}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};

const SearchScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Search" subtitle="Find people & content" />
    <View style={styles.scrollContent}>
      <Input placeholder="Search..." icon="🔍" />
      <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>TRENDING</Text>
      <ListItem title="#TechNews" subtitle="2.4K posts" icon="📱" />
      <ListItem title="#Design" subtitle="1.8K posts" icon="🎨" />
      <ListItem title="#Startup" subtitle="956 posts" icon="🚀" />
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={[styles.listItemIcon, { width: 100, height: 100, borderRadius: 50, marginBottom: 16 }]}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={styles.headerTitle}>Your Name</Text>
        <Text style={styles.listItemSubtitle}>@username</Text>
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.listItemTitle}>1.2K</Text>
            <Text style={styles.listItemSubtitle}>Followers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.listItemTitle}>348</Text>
            <Text style={styles.listItemSubtitle}>Following</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.listItemTitle}>56</Text>
            <Text style={styles.listItemSubtitle}>Posts</Text>
          </View>
        </View>
      </View>
      <Button title="Edit Profile" variant="outline" />
    </ScrollView>
  </SafeAreaView>
);`,
    
    productivity: `
const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Complete project proposal', done: false, priority: 'high' },
    { id: 2, title: 'Review team updates', done: true, priority: 'medium' },
    { id: 3, title: 'Schedule meeting', done: false, priority: 'low' },
  ]);
  
  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="Today's Tasks" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tasks.map(task => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.listItem, task.done && { opacity: 0.5 }]}
            onPress={() => toggleTask(task.id)}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>{task.done ? '✅' : '⬜'}</Text>
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, task.done && { textDecorationLine: 'line-through' }]}>
                {task.title}
              </Text>
              <Badge text={task.priority} variant={task.priority === 'high' ? 'primary' : 'success'} />
            </View>
          </TouchableOpacity>
        ))}
        <Button title="+ Add Task" style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const CalendarScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Calendar" subtitle="December ${data.year}" />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📅</Text>
      <Text style={styles.emptyStateTitle}>No Events Today</Text>
      <Text style={styles.emptyStateText}>Tap + to add a new event</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Settings" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Account" subtitle="Manage your account" icon="👤" />
      <ListItem title="Notifications" subtitle="Configure alerts" icon="🔔" />
      <ListItem title="Appearance" subtitle="Dark mode, themes" icon="🎨" />
      <ListItem title="Privacy" subtitle="Data & security" icon="🔒" />
      <ListItem title="Help & Support" subtitle="Get assistance" icon="❓" />
    </ScrollView>
  </SafeAreaView>
);`,

    ecommerce: `
const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Premium Headphones', price: '$299', rating: 4.8, image: '🎧' },
    { id: 2, name: 'Smart Watch', price: '$199', rating: 4.6, image: '⌚' },
    { id: 3, name: 'Wireless Speaker', price: '$149', rating: 4.7, image: '🔊' },
  ]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="Shop the latest" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input placeholder="Search products..." icon="🔍" />
        {products.map(product => (
          <Card key={product.id}>
            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.featureIcon, { marginRight: 16 }]}>
                <Text style={{ fontSize: 32 }}>{product.image}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{product.name}</Text>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 18 }}>{product.price}</Text>
                <Text style={styles.listItemSubtitle}>⭐ {product.rating}</Text>
              </View>
            </View>
            <Button title="Add to Cart" size="sm" style={{ marginTop: 12 }} />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const CartScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Cart" subtitle="2 items" />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🛒</Text>
      <Text style={styles.emptyStateTitle}>Your Cart</Text>
      <Text style={styles.emptyStateText}>Add items to get started</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Account" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Orders" subtitle="Track your orders" icon="📦" />
      <ListItem title="Wishlist" subtitle="Saved items" icon="❤️" />
      <ListItem title="Payment Methods" subtitle="Manage cards" icon="💳" />
      <ListItem title="Addresses" subtitle="Shipping addresses" icon="📍" />
      <ListItem title="Settings" subtitle="App preferences" icon="⚙️" />
    </ScrollView>
  </SafeAreaView>
);`,

    fitness: `
const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    steps: 8432,
    calories: 420,
    minutes: 45,
    workouts: 3
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="Today's Progress" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>👟</Text>
              <Text style={styles.headerTitle}>{stats.steps.toLocaleString()}</Text>
              <Text style={styles.listItemSubtitle}>Steps</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>🔥</Text>
              <Text style={styles.headerTitle}>{stats.calories}</Text>
              <Text style={styles.listItemSubtitle}>Calories</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>⏱️</Text>
              <Text style={styles.headerTitle}>{stats.minutes}</Text>
              <Text style={styles.listItemSubtitle}>Minutes</Text>
            </View>
          </View>
        </Card>
        <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>WORKOUTS</Text>
        <ListItem title="Morning Run" subtitle="5.2 km • 32 min" icon="🏃" />
        <ListItem title="Strength Training" subtitle="45 min • Upper body" icon="💪" />
        <ListItem title="Yoga Session" subtitle="30 min • Flexibility" icon="🧘" />
        <Button title="Start Workout" style={{ marginTop: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const WorkoutsScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Workouts" subtitle="Choose your workout" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="HIIT Training" subtitle="20 min • High intensity" icon="⚡" />
      <ListItem title="Full Body" subtitle="45 min • Strength" icon="🏋️" />
      <ListItem title="Cardio Blast" subtitle="30 min • Endurance" icon="❤️" />
      <ListItem title="Core Workout" subtitle="15 min • Abs focus" icon="🎯" />
    </ScrollView>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Profile" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 64, marginBottom: 12 }}>🏆</Text>
          <Text style={styles.headerTitle}>Level 12</Text>
          <Text style={styles.listItemSubtitle}>Fitness Enthusiast</Text>
        </View>
      </Card>
      <ListItem title="Goals" subtitle="Set your targets" icon="🎯" />
      <ListItem title="History" subtitle="Past workouts" icon="📊" />
      <ListItem title="Achievements" subtitle="12 badges earned" icon="🏅" />
    </ScrollView>
  </SafeAreaView>
);`,

    finance: `
const HomeScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(12450.00);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="Your Finances" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={{ backgroundColor: theme.colors.primary }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Total Balance</Text>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>\${balance.toLocaleString()}</Text>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
            <Button title="Send" variant="secondary" size="sm" style={{ flex: 1 }} />
            <Button title="Receive" variant="secondary" size="sm" style={{ flex: 1 }} />
          </View>
        </Card>
        <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>RECENT TRANSACTIONS</Text>
        <ListItem title="Coffee Shop" subtitle="Today • Food & Drink" icon="☕" trailing={<Text style={{ color: theme.colors.error }}>-$4.50</Text>} />
        <ListItem title="Salary" subtitle="Dec 1 • Income" icon="💰" trailing={<Text style={{ color: theme.colors.success }}>+$5,000</Text>} />
        <ListItem title="Netflix" subtitle="Nov 28 • Entertainment" icon="📺" trailing={<Text style={{ color: theme.colors.error }}>-$15.99</Text>} />
      </ScrollView>
    </SafeAreaView>
  );
};

const CardsScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Cards" subtitle="Manage your cards" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card style={{ backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>VISA</Text>
        <Text style={{ color: '#fff', fontSize: 20, letterSpacing: 2 }}>•••• •••• •••• 4242</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Your Name</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>12/26</Text>
        </View>
      </Card>
      <Button title="+ Add New Card" variant="outline" style={{ marginTop: 16 }} />
    </ScrollView>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Settings" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Account" subtitle="Personal info" icon="👤" />
      <ListItem title="Security" subtitle="Password, 2FA" icon="🔒" />
      <ListItem title="Notifications" subtitle="Alerts & updates" icon="🔔" />
      <ListItem title="Statements" subtitle="Download reports" icon="📄" />
      <ListItem title="Help" subtitle="Support center" icon="❓" />
    </ScrollView>
  </SafeAreaView>
);`,

    food: `
const HomeScreen = ({ navigation }) => {
  const [restaurants, setRestaurants] = useState([
    { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.8, time: '25-35 min', image: '🍕' },
    { id: 2, name: 'Sushi Master', cuisine: 'Japanese', rating: 4.9, time: '30-40 min', image: '🍣' },
    { id: 3, name: 'Burger Joint', cuisine: 'American', rating: 4.6, time: '20-30 min', image: '🍔' },
  ]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="${data.name}" subtitle="What are you craving?" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input placeholder="Search restaurants..." icon="🔍" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
          {['🍕 Pizza', '🍔 Burgers', '🍣 Sushi', '🥗 Healthy', '🍜 Asian'].map((cat, i) => (
            <TouchableOpacity key={i} style={{ backgroundColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 }}>
              <Text>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {restaurants.map(r => (
          <Card key={r.id}>
            <View style={{ flexDirection: 'row' }}>
              <View style={[styles.featureIcon, { marginRight: 16, width: 70, height: 70 }]}>
                <Text style={{ fontSize: 36 }}>{r.image}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{r.name}</Text>
                <Text style={styles.listItemSubtitle}>{r.cuisine} • ⭐ {r.rating}</Text>
                <Text style={styles.listItemSubtitle}>🕐 {r.time}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const OrdersScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Orders" subtitle="Track your orders" />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📦</Text>
      <Text style={styles.emptyStateTitle}>No Active Orders</Text>
      <Text style={styles.emptyStateText}>Your orders will appear here</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Account" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Favorites" subtitle="Saved restaurants" icon="❤️" />
      <ListItem title="Addresses" subtitle="Delivery locations" icon="📍" />
      <ListItem title="Payment" subtitle="Payment methods" icon="💳" />
      <ListItem title="Promotions" subtitle="Deals & offers" icon="🎁" />
      <ListItem title="Settings" subtitle="App preferences" icon="⚙️" />
    </ScrollView>
  </SafeAreaView>
);`,

    travel: `
const HomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="${data.name}" subtitle="Where to next?" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Input placeholder="Search destinations..." icon="🔍" />
      <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>POPULAR DESTINATIONS</Text>
      <Card>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🗼</Text>
        <Text style={styles.featureTitle}>Paris, France</Text>
        <Text style={styles.listItemSubtitle}>From $599 • 5 nights</Text>
      </Card>
      <Card>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🗽</Text>
        <Text style={styles.featureTitle}>New York, USA</Text>
        <Text style={styles.listItemSubtitle}>From $449 • 4 nights</Text>
      </Card>
      <Card>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🏯</Text>
        <Text style={styles.featureTitle}>Tokyo, Japan</Text>
        <Text style={styles.listItemSubtitle}>From $799 • 7 nights</Text>
      </Card>
    </ScrollView>
  </SafeAreaView>
);

const TripsScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="My Trips" subtitle="Upcoming & past" />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>✈️</Text>
      <Text style={styles.emptyStateTitle}>No Trips Yet</Text>
      <Text style={styles.emptyStateText}>Start planning your next adventure</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Profile" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Saved Places" subtitle="Your wishlist" icon="❤️" />
      <ListItem title="Rewards" subtitle="Points & benefits" icon="🎁" />
      <ListItem title="Payment" subtitle="Payment methods" icon="💳" />
      <ListItem title="Settings" subtitle="Preferences" icon="⚙️" />
    </ScrollView>
  </SafeAreaView>
);`,

    education: `
const HomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="${data.name}" subtitle="Continue Learning" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card style={{ backgroundColor: theme.colors.primary }}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Current Course</Text>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>JavaScript Fundamentals</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', height: 8, borderRadius: 4 }}>
          <View style={{ backgroundColor: '#fff', height: 8, borderRadius: 4, width: '65%' }} />
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>65% Complete</Text>
      </Card>
      <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>RECOMMENDED</Text>
      <ListItem title="React Native Basics" subtitle="12 lessons • 3 hours" icon="📱" />
      <ListItem title="UI/UX Design" subtitle="8 lessons • 2 hours" icon="🎨" />
      <ListItem title="Python for Beginners" subtitle="15 lessons • 4 hours" icon="🐍" />
    </ScrollView>
  </SafeAreaView>
);

const CoursesScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Courses" subtitle="Browse all courses" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Input placeholder="Search courses..." icon="🔍" />
      <ListItem title="Web Development" subtitle="24 courses" icon="💻" />
      <ListItem title="Mobile Development" subtitle="18 courses" icon="📱" />
      <ListItem title="Data Science" subtitle="15 courses" icon="📊" />
      <ListItem title="Design" subtitle="12 courses" icon="🎨" />
    </ScrollView>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Profile" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎓</Text>
          <Text style={styles.headerTitle}>Level 8</Text>
          <Text style={styles.listItemSubtitle}>1,250 XP</Text>
        </View>
      </Card>
      <ListItem title="Certificates" subtitle="3 earned" icon="📜" />
      <ListItem title="Achievements" subtitle="12 badges" icon="🏆" />
      <ListItem title="Settings" subtitle="Preferences" icon="⚙️" />
    </ScrollView>
  </SafeAreaView>
);`,

    media: `
const HomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="${data.name}" subtitle="Now Playing" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
        <View style={[styles.featureIcon, { width: 200, height: 200, borderRadius: 16, marginBottom: 24 }]}>
          <Text style={{ fontSize: 80 }}>🎵</Text>
        </View>
        <Text style={styles.headerTitle}>Song Title</Text>
        <Text style={styles.listItemSubtitle}>Artist Name</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 24 }}>
          <TouchableOpacity><Text style={{ fontSize: 32 }}>⏮️</Text></TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: theme.colors.primary, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, color: '#fff' }}>▶️</Text>
          </TouchableOpacity>
          <TouchableOpacity><Text style={{ fontSize: 32 }}>⏭️</Text></TouchableOpacity>
        </View>
      </Card>
      <Text style={[styles.listItemSubtitle, { marginTop: 20, marginBottom: 12 }]}>UP NEXT</Text>
      <ListItem title="Another Song" subtitle="Different Artist" icon="🎵" />
      <ListItem title="Great Track" subtitle="Cool Band" icon="🎵" />
    </ScrollView>
  </SafeAreaView>
);

const LibraryScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Library" subtitle="Your music" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Liked Songs" subtitle="128 songs" icon="❤️" />
      <ListItem title="Playlists" subtitle="12 playlists" icon="📋" />
      <ListItem title="Albums" subtitle="45 albums" icon="💿" />
      <ListItem title="Artists" subtitle="32 artists" icon="🎤" />
    </ScrollView>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Settings" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Audio Quality" subtitle="High quality streaming" icon="🔊" />
      <ListItem title="Downloads" subtitle="Offline playback" icon="📥" />
      <ListItem title="Equalizer" subtitle="Sound settings" icon="🎛️" />
      <ListItem title="Account" subtitle="Subscription & billing" icon="👤" />
    </ScrollView>
  </SafeAreaView>
);`,

    utility: `
const HomeScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="${data.name}" subtitle="Quick Tools" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {[
          { icon: '🔢', title: 'Calculator' },
          { icon: '📏', title: 'Converter' },
          { icon: '📝', title: 'Notes' },
          { icon: '⏱️', title: 'Timer' },
          { icon: '🔦', title: 'Flashlight' },
          { icon: '📷', title: 'Scanner' },
        ].map((tool, i) => (
          <TouchableOpacity key={i} style={{ width: '47%', backgroundColor: theme.colors.surface, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>{tool.icon}</Text>
            <Text style={styles.listItemTitle}>{tool.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

const HistoryScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="History" subtitle="Recent activity" />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No History Yet</Text>
      <Text style={styles.emptyStateText}>Your recent activity will appear here</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Settings" />
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ListItem title="Appearance" subtitle="Theme & display" icon="🎨" />
      <ListItem title="Notifications" subtitle="Alerts & sounds" icon="🔔" />
      <ListItem title="Privacy" subtitle="Data & permissions" icon="🔒" />
      <ListItem title="About" subtitle="Version & info" icon="ℹ️" />
    </ScrollView>
  </SafeAreaView>
);`,
  };

  // Add DetailScreen for all types
  const detailScreen = `
const DetailScreen = ({ route, navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <Header title="Details" showBack onBack={() => navigation.goBack()} />
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📄</Text>
      <Text style={styles.emptyStateTitle}>Detail View</Text>
      <Text style={styles.emptyStateText}>Content details would appear here</Text>
    </View>
  </SafeAreaView>
);`;

  return (screens[type] || screens.utility) + '\n' + detailScreen;
}

function generateTabScreens(type: AppTemplateType): string {
  const tabs: Record<AppTemplateType, Array<{ name: string; component: string; icon: string }>> = {
    social: [
      { name: 'Home', component: 'HomeScreen', icon: '🏠' },
      { name: 'Search', component: 'SearchScreen', icon: '🔍' },
      { name: 'Profile', component: 'ProfileScreen', icon: '👤' },
    ],
    productivity: [
      { name: 'Tasks', component: 'HomeScreen', icon: '✅' },
      { name: 'Calendar', component: 'CalendarScreen', icon: '📅' },
      { name: 'Settings', component: 'ProfileScreen', icon: '⚙️' },
    ],
    ecommerce: [
      { name: 'Shop', component: 'HomeScreen', icon: '🛍️' },
      { name: 'Cart', component: 'CartScreen', icon: '🛒' },
      { name: 'Account', component: 'ProfileScreen', icon: '👤' },
    ],
    fitness: [
      { name: 'Today', component: 'HomeScreen', icon: '🏃' },
      { name: 'Workouts', component: 'WorkoutsScreen', icon: '💪' },
      { name: 'Profile', component: 'ProfileScreen', icon: '👤' },
    ],
    finance: [
      { name: 'Home', component: 'HomeScreen', icon: '🏠' },
      { name: 'Cards', component: 'CardsScreen', icon: '💳' },
      { name: 'Settings', component: 'ProfileScreen', icon: '⚙️' },
    ],
    food: [
      { name: 'Home', component: 'HomeScreen', icon: '🍽️' },
      { name: 'Orders', component: 'OrdersScreen', icon: '📦' },
      { name: 'Account', component: 'ProfileScreen', icon: '👤' },
    ],
    travel: [
      { name: 'Explore', component: 'HomeScreen', icon: '🌍' },
      { name: 'Trips', component: 'TripsScreen', icon: '✈️' },
      { name: 'Profile', component: 'ProfileScreen', icon: '👤' },
    ],
    education: [
      { name: 'Learn', component: 'HomeScreen', icon: '📚' },
      { name: 'Courses', component: 'CoursesScreen', icon: '🎓' },
      { name: 'Profile', component: 'ProfileScreen', icon: '👤' },
    ],
    media: [
      { name: 'Playing', component: 'HomeScreen', icon: '🎵' },
      { name: 'Library', component: 'LibraryScreen', icon: '📚' },
      { name: 'Settings', component: 'ProfileScreen', icon: '⚙️' },
    ],
    utility: [
      { name: 'Tools', component: 'HomeScreen', icon: '🔧' },
      { name: 'History', component: 'HistoryScreen', icon: '📋' },
      { name: 'Settings', component: 'ProfileScreen', icon: '⚙️' },
    ],
  };

  const selectedTabs = tabs[type] || tabs.utility;
  
  return selectedTabs.map(tab => 
    `<Tab.Screen 
      name="${tab.name}" 
      component={${tab.component}}
      options={{
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>${tab.icon}</Text>
        ),
      }}
    />`
  ).join('\n    ');
}
