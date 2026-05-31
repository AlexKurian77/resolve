/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertService } from '../../utils/AlertService';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { colors, spacing, radius } from '../../utils/theme';

/* ---------- Small helper components ---------- */

const PieChart = ({ resisted = 0, relapsed = 0, size = 110 }) => {
  const total = resisted + relapsed || 1;
  const relapsedAngle = (relapsed / total) * 360;
  return (
    <View style={styles.pieChartContainer}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: colors.success,
          borderRightColor: colors.danger,
          borderTopColor: relapsedAngle > 180 ? colors.danger : colors.success,
          borderBottomColor:
            relapsedAngle > 270 ? colors.danger : colors.success,
          borderLeftColor: relapsedAngle > 90 ? colors.danger : colors.success,
          transform: [{ rotate: `${-90 + relapsedAngle / 2}deg` }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{ transform: [{ rotate: `${90 - relapsedAngle / 2}deg` }] }}
        >
          <Text style={styles.pieChartText}>{resisted.toFixed(0)}%</Text>
          <Text style={styles.pieChartSubText}>Resisted</Text>
        </View>
      </View>
      <View style={styles.pieChartLegend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.success }]}
          />
          <Text style={styles.legendText}>
            Resisted ({resisted.toFixed(1)}%)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.danger }]}
          />
          <Text style={styles.legendText}>
            Relapsed ({relapsed.toFixed(1)}%)
          </Text>
        </View>
      </View>
    </View>
  );
};

const FeelingsHeatmap = ({ data = {} }) => {
  const feelings = Object.keys(data);
  if (feelings.length === 0)
    return (
      <Text style={{ color: colors.textMuted }}>No feelings data yet.</Text>
    );
  const maxValue = Math.max(...Object.values(data), 1);

  return (
    <View style={styles.heatmapContainer}>
      {feelings.map(feeling => {
        const value = data[feeling];
        const intensity = value / maxValue;
        const bgColor =
          intensity > 0.7
            ? colors.danger
            : intensity > 0.4
            ? colors.warning
            : colors.success;
        return (
          <View key={feeling} style={styles.heatmapItem}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: radius.xl,
                backgroundColor: `${bgColor}1A`,
                borderWidth: 1,
                borderColor: `${bgColor}40`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Text
                style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}
              >
                {Number(value).toFixed(0)}%
              </Text>
            </View>
            <Text style={styles.heatmapLabel}>{feeling}</Text>
          </View>
        );
      })}
    </View>
  );
};

/* ---------- Analytics logic ---------- */

const computeStreak = (urges, storedBestStreak = 0) => {
  const relapses = urges
    .filter(u => u.outcome === 'relapsed')
    .map(u =>
      u.date ? new Date(u.date) : u.timestamp ? new Date(u.timestamp) : null,
    )
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (relapses.length === 0) {
    const firstDate = urges.length
      ? new Date(urges[0].date || urges[0].timestamp || Date.now())
      : new Date();
    const days = Math.max(
      0,
      Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return {
      currentStreak: days,
      bestStreak: Math.max(days || 0, storedBestStreak),
      avg_time_to_relapse_hours: null,
      commitment_score_rolling_30d_avg: 100,
    };
  }

  const lastRelapse = relapses[relapses.length - 1];
  const currentStreak = Math.floor(
    (Date.now() - lastRelapse.getTime()) / (1000 * 60 * 60 * 24),
  );

  let best = 0;
  for (let i = 1; i < relapses.length; i++) {
    const gapDays = Math.floor(
      (relapses[i].getTime() - relapses[i - 1].getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (gapDays > best) best = gapDays;
  }
  best = Math.max(
    best,
    Math.floor((Date.now() - relapses[0].getTime()) / (1000 * 60 * 60 * 24)),
    currentStreak,
    storedBestStreak,
  );

  let avgHours = null;
  const allPoints = [];
  if (urges.length > 0) {
    const firstUrge = urges[0];
    const firstUrgeDate = firstUrge.date
      ? new Date(firstUrge.date)
      : firstUrge.timestamp
      ? new Date(firstUrge.timestamp)
      : null;
    if (
      firstUrgeDate &&
      relapses.length > 0 &&
      firstUrgeDate.getTime() < relapses[0].getTime()
    ) {
      allPoints.push(firstUrgeDate);
    }
  }
  allPoints.push(...relapses);

  if (allPoints.length >= 2) {
    let totalDiff = 0;
    for (let i = 1; i < allPoints.length; i++)
      totalDiff += allPoints[i].getTime() - allPoints[i - 1].getTime();
    avgHours = totalDiff / (allPoints.length - 1) / (1000 * 60 * 60);
  }

  return {
    currentStreak,
    bestStreak: best,
    avg_time_to_relapse_hours: avgHours,
    commitment_score_rolling_30d_avg: null,
  };
};

const computeAnalysis = (urges, storedBestStreak = 0) => {
  if (!Array.isArray(urges) || urges.length === 0) return null;

  const outcomes = { resisted: 0, relapsed: 0 };
  const feelings = {};
  const hours = {};
  const monthly = {};

  urges.forEach(entry => {
    const outcome = entry.outcome || 'resisted';
    const feeling = entry.feelingName || entry.feeling || 'unknown';
    const hour =
      typeof entry.hour === 'number'
        ? entry.hour
        : new Date(entry.date || entry.timestamp || Date.now()).getHours();
    const when = entry.date
      ? new Date(entry.date)
      : entry.timestamp
      ? new Date(entry.timestamp)
      : new Date();

    outcomes[outcome] = (outcomes[outcome] || 0) + 1;
    feelings[feeling] = feelings[feeling] || { total: 0, relapsed: 0 };
    feelings[feeling].total++;
    if (outcome === 'relapsed') feelings[feeling].relapsed++;
    hours[hour] = hours[hour] || { relapsed: 0, resisted: 0 };
    hours[hour][outcome] = (hours[hour][outcome] || 0) + 1;
    const mkey = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
    monthly[mkey] = monthly[mkey] || { relapsed: 0, total: 0 };
    monthly[mkey].total++;
    if (outcome === 'relapsed') monthly[mkey].relapsed++;
  });

  const total = urges.length;
  const resistedPct = ((outcomes.resisted || 0) / total) * 100;
  const relapsedPct = ((outcomes.relapsed || 0) / total) * 100;

  const feelingCorrelation = {};
  Object.keys(feelings).forEach(f => {
    feelingCorrelation[f] = (feelings[f].relapsed / feelings[f].total) * 100;
  });

  const relapseHours = Object.keys(hours)
    .filter(h => hours[h].relapsed > 0)
    .map(h => parseInt(h, 10))
    .sort((a, b) => a - b);

  const monthlyProgress = {};
  Object.keys(monthly)
    .sort()
    .forEach(k => {
      monthlyProgress[k] = Number(
        ((1 - monthly[k].relapsed / monthly[k].total) * 100).toFixed(1),
      );
    });

  const streak = computeStreak(urges, storedBestStreak);
  const commitmentScore = Math.round(resistedPct);

  const sortedFeelings = Object.entries(feelingCorrelation).sort(
    (a, b) => a[1] - b[1],
  );
  const mostProtective = sortedFeelings[0]?.[0] || 'N/A';
  const mostVulnerable =
    sortedFeelings[sortedFeelings.length - 1]?.[0] || 'N/A';

  return {
    event_level: {
      urge_outcome_rate: {
        resisted_pct: Number(resistedPct.toFixed(1)),
        relapsed_pct: Number(relapsedPct.toFixed(1)),
      },
      feeling_to_outcome_correlation: feelingCorrelation,
    },
    time_based: {
      peak_relapse_hours: relapseHours,
      recovery_progress_over_time_pct: monthlyProgress,
    },
    commitment: {
      ...streak,
      commitment_score_rolling_30d_avg: commitmentScore,
    },
    feeling_dynamics: {
      most_vulnerable_feeling: mostVulnerable,
      most_protective_feeling: mostProtective,
    },
    user_feedback_loops: {
      personalized_risk_profile: `You are most at risk when feeling '${mostVulnerable}' during hour ${
        relapseHours[0] ?? 'N/A'
      }.`,
    },
  };
};

/* ---------- Main screen ---------- */

export default function AnalyticsScreen() {
  const [userData, setUserData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const generateCSV = urges => {
    if (!urges || urges.length === 0) return '';
    const headers = 'outcome,feeling,feelingName,date,hour\n';
    const rows = urges
      .map(u =>
        [
          u.outcome || '',
          u.feeling || '',
          u.feelingName || '',
          u.date || '',
          u.hour ?? '',
        ].join(','),
      )
      .join('\n');
    return headers + rows;
  };

  const handleExportCSV = async () => {
    try {
      if (!userData || !userData.urges || userData.urges.length === 0) {
        AlertService.alert(
          'No Data',
          "You don't have any urges to export yet.",
        );
        return;
      }
      const csv = generateCSV(userData.urges);
      const path = `${RNFS.CachesDirectoryPath}/resolve_urges_export.csv`;
      await RNFS.writeFile(path, csv, 'utf8');
      await Share.open({
        url: 'file://' + path,
        type: 'text/csv',
        title: 'Export Resolve Data',
        subject: 'Resolve CSV Export',
        filename: 'resolve_urges_export',
      });
      AlertService.success('Exported!', 'CSV is ready to be shared or saved.');
    } catch (err) {
      console.log('CSV Export Error:', err);
      AlertService.alert('Error', 'Failed to export CSV.');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  };

  const fetchAnalytics = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setUserData(null);
        setAnalysisData(null);
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists()) {
        setUserData(null);
        setAnalysisData(null);
        return;
      }
      const data = snap.data() || {};
      const urges = Array.isArray(data.urges) ? data.urges : [];
      setUserData(data);
      setAnalysisData(computeAnalysis(urges, data.bestStreak || 0) || null);
    } catch (err) {
      console.error('Analytics load error:', err);
      setUserData(null);
      setAnalysisData(null);
    }
  };
  // Run once on screen load
  useEffect(() => {
    fetchAnalytics().then(() => setLoading(false));
  }, []);

  const safe = (path, fallback) => {
    try {
      return path ?? fallback;
    } catch {
      return fallback;
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

    if (!analysisData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recovery Analytics</Text>
          <MaterialCommunityIcons name="chart-line" size={22} color={colors.accent} />
        </View>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>No data yet</Text>
            <Text style={styles.sectionSubText}>
              Record some urges first - then come back here for personalized analytics.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }


  const currentStreak = safe(analysisData.commitment.currentStreak, 0);
  const bestStreak = safe(analysisData.commitment.bestStreak, 0);
  const score = safe(
    analysisData.commitment.commitment_score_rolling_30d_avg,
    0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recovery Analytics</Text>
        <MaterialCommunityIcons
          name="chart-line"
          size={22}
          color={colors.accent}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Recovery Overview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recovery Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {analysisData.event_level.urge_outcome_rate.resisted_pct.toFixed(
                  1,
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Resisted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {analysisData.event_level.urge_outcome_rate.relapsed_pct.toFixed(
                  1,
                )}
                %
              </Text>
              <Text style={styles.statLabel}>Relapsed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {score.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
          </View>
        </View>

        {/* Outcome Distribution */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Outcome Distribution</Text>
          <PieChart
            resisted={analysisData.event_level.urge_outcome_rate.resisted_pct}
            relapsed={analysisData.event_level.urge_outcome_rate.relapsed_pct}
          />
        </View>

        {/* Feelings Impact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Feelings Impact Map</Text>
          <Text style={styles.sectionSubText}>
            Relapse probability by emotional state
          </Text>
          <FeelingsHeatmap
            data={analysisData.event_level.feeling_to_outcome_correlation}
          />
        </View>

        {/* Commitment Trend */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Commitment Trend</Text>
          <Text style={styles.sectionSubText}>
            Monthly resistance rate progression
          </Text>
          {analysisData.time_based.recovery_progress_over_time_pct &&
          Object.keys(analysisData.time_based.recovery_progress_over_time_pct)
            .length ? (
            <View style={{ marginTop: spacing.sm }}>
              {Object.entries(
                analysisData.time_based.recovery_progress_over_time_pct,
              ).map(([k, v]) => (
                <View
                  key={k}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                    paddingVertical: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {k}
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {v}%
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.textMuted }}>
              Not enough data for monthly trend
            </Text>
          )}
        </View>

        {/* Time Risk Pattern */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Time Risk Pattern</Text>
          <Text style={styles.sectionSubText}>
            Relapse risk throughout the day
          </Text>
          <View style={{ marginTop: spacing.sm }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeChartContainer}>
                {Array.from({ length: 24 }, (_, hour) => {
                  const isPeak = (
                    analysisData.time_based.peak_relapse_hours || []
                  ).includes(hour);
                  return (
                    <View key={hour} style={styles.timeBarContainer}>
                      <View
                        style={{
                          width: 10,
                          height: isPeak ? 52 : 16,
                          borderTopLeftRadius: 2,
                          borderTopRightRadius: 2,
                          backgroundColor: isPeak
                            ? colors.danger
                            : colors.accent,
                        }}
                      />
                      <Text style={styles.timeLabel}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.timeChartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.danger }]}
                />
                <Text style={styles.legendText}>High Risk</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.accent }]}
                />
                <Text style={styles.legendText}>Normal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Insights */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Insights</Text>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={18}
                color={colors.danger}
              />
              <Text style={[styles.insightTitle, { color: colors.danger }]}>
                Most Vulnerable Time
              </Text>
            </View>
            <Text style={styles.insightText}>
              {(analysisData.time_based.peak_relapse_hours || []).length
                ? (() => {
                    try {
                      const ph = analysisData.time_based.peak_relapse_hours;
                      const formatHour = hour =>
                        hour === 0
                          ? '12am'
                          : hour < 12
                          ? `${hour}am`
                          : hour === 12
                          ? '12pm'
                          : `${hour - 12}pm`;
                      return `${formatHour(Math.min(...ph))} - ${formatHour(
                        Math.max(...ph) + 1,
                      )}`;
                    } catch {
                      return 'N/A';
                    }
                  })()
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.insightTitle, { color: colors.success }]}>
                Protective Feeling
              </Text>
            </View>
            <Text style={styles.insightText}>
              {analysisData.feeling_dynamics.most_protective_feeling} — lower
              relapse rate
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <MaterialCommunityIcons
                name="brain"
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.insightTitle, { color: colors.accent }]}>
                Risk Profile
              </Text>
            </View>
            <Text style={styles.insightText}>
              {analysisData.user_feedback_loops.personalized_risk_profile}
            </Text>
          </View>
        </View>

        {/* Recovery Statistics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recovery Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
              <Text style={styles.statUnit}>days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
              <Text style={styles.statUnit}>days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {analysisData.commitment.avg_time_to_relapse_hours !== null &&
                analysisData.commitment.avg_time_to_relapse_hours !== undefined
                  ? Math.round(
                      analysisData.commitment.avg_time_to_relapse_hours,
                    )
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Avg Between</Text>
              <Text style={styles.statUnit}>hours</Text>
            </View>
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Recovery Progress</Text>
            <View style={styles.progressBar}>
              <View
                style={{
                  width: `${
                    analysisData.commitment.commitment_score_rolling_30d_avg ??
                    0
                  }%`,
                  height: 6,
                  borderRadius: radius.full,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <Text style={styles.progressText}>
              {(
                analysisData.commitment.commitment_score_rolling_30d_avg ?? 0
              ).toFixed(0)}
              % commitment score
            </Text>
          </View>
        </View>

        {/* Export */}
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
          <MaterialCommunityIcons
            name="download-outline"
            size={18}
            color={colors.text}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  scrollContent: { paddingBottom: 100 },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  sectionSubText: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  overviewStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 32, fontWeight: '700', color: colors.text },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statUnit: { color: colors.textMuted, fontSize: 11 },
  pieChartContainer: { alignItems: 'center' },
  pieChartText: { color: colors.text, fontSize: 22, fontWeight: '700' },
  pieChartSubText: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  pieChartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 12 },
  heatmapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  heatmapItem: { alignItems: 'center', width: '28%' },
  heatmapLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  timeChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 72,
    paddingHorizontal: spacing.sm,
  },
  timeBarContainer: { alignItems: 'center', marginHorizontal: 3 },
  timeLabel: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
  timeChartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  insightCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  insightTitle: { fontWeight: '600', fontSize: 14 },
  insightText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  progressContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  progressText: { color: colors.textMuted, fontSize: 12, textAlign: 'right' },
  exportBtn: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
