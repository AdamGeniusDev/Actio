import { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { SafeScreenView } from '@/components/layout/SafeScreenView';
import { TaskCard } from '@/components/tasks/TaskCard';
import { useTasksStore } from '@/stores/tasks.store';
import { Gradients } from '@/constants/theme';
import { addDays, addWeeks, addMonths, isSameDay, isToday, dateKey, startOfWeek } from '@/utils/date.utils';
import { buildMonthGrid, groupTasksByDay, resolveDotColor, buildDayLabel, computeWeekStats } from '@/utils/planning.utils';
import type { Task } from '@/types/task.types';

type PlanningView = 'week' | 'month';

export default function PlanningScreen() {
  const { t } = useTranslation('planning');

  const [view,        setView]        = useState<PlanningView>('week');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [weekStart,   setWeekStart]   = useState<Date>(() => startOfWeek(new Date()));
  const [monthRef,    setMonthRef]    = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const tasks   = useTasksStore((s) => s.tasks);
  const today   = useMemo(() => new Date(), []);
  const taskMap = useMemo(() => groupTasksByDay(tasks), [tasks]);

  // ── Tableaux i18n stables (rechargés seulement si la langue change)
  const daysShort = useMemo(() => t('days.short', { returnObjects: true }) as string[], [t]);
  const daysFull  = useMemo(() => t('days.full',  { returnObjects: true }) as string[], [t]);
  const months    = useMemo(() => t('months',      { returnObjects: true }) as string[], [t]);

  // ── Semaine
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const stats = useMemo(() => computeWeekStats(weekDays, taskMap), [weekDays, taskMap]);

  // ── Mois
  const monthGrid = useMemo(
    () => buildMonthGrid(monthRef.getFullYear(), monthRef.getMonth()),
    [monthRef],
  );

  // ── Sections vue semaine
  const sections = useMemo(
    () => weekDays.map(day => ({ day, data: taskMap.get(dateKey(day)) ?? [] })).filter(s => s.data.length > 0),
    [weekDays, taskMap],
  );

  // ── Tâches du jour sélectionné (vue mois)
  const selectedDayTasks = useMemo(
    () => taskMap.get(dateKey(selectedDay)) ?? [],
    [selectedDay, taskMap],
  );

  // ── Navigation
  const goBack = useCallback(() => {
    view === 'week' ? setWeekStart(w => addWeeks(w, -1)) : setMonthRef(m => addMonths(m, -1));
  }, [view]);

  const goForward = useCallback(() => {
    view === 'week' ? setWeekStart(w => addWeeks(w, 1)) : setMonthRef(m => addMonths(m, 1));
  }, [view]);

  const goToToday = useCallback(() => {
    setWeekStart(startOfWeek(today));
    setMonthRef(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  }, [today]);

  // ── Label de plage
  const headerLabel = useMemo(() => {
    if (view === 'week') {
      const end    = addDays(weekStart, 6);
      const startM = months[weekStart.getMonth()];
      const endM   = months[end.getMonth()];
      return weekStart.getMonth() === end.getMonth()
        ? `${weekStart.getDate()} – ${end.getDate()} ${startM} ${weekStart.getFullYear()}`
        : `${weekStart.getDate()} ${startM} – ${end.getDate()} ${endM} ${end.getFullYear()}`;
    }
    return `${months[monthRef.getMonth()]} ${monthRef.getFullYear()}`;
  }, [view, weekStart, monthRef, months]);

  const showTodayBtn = view === 'week'
    ? !isSameDay(weekStart, startOfWeek(today))
    : !(monthRef.getFullYear() === today.getFullYear() && monthRef.getMonth() === today.getMonth());

  return (
    <SafeScreenView className="flex-1 bg-background" withGradient>
      <View>
        <View className="flex-row items-start justify-between px-4 pt-sm pb-md">
          <View>
            <Text className="font-space-bold text-display-m text-text-primary mb-1">
              {t(view === 'week' ? 'title.week' : 'title.month')}
            </Text>
            <View className="flex-row items-center gap-sm">
              <Pressable onPress={goBack} hitSlop={8}>
                <ChevronLeft size={18} color="#8BA3BE" />
              </Pressable>
              <Text className="font-inter-medium text-body-s text-text-secondary">
                {headerLabel}
              </Text>
              <Pressable onPress={goForward} hitSlop={8}>
                <ChevronRight size={18} color="#8BA3BE" />
              </Pressable>
            </View>
          </View>

          <View className="items-end gap-sm">
            {showTodayBtn && (
              <Pressable onPress={goToToday} className="rounded-full overflow-hidden">
                <LinearGradient
                  {...Gradients.accent}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                >
                  <Text className="font-inter-bold text-[11px] text-white tracking-[0.8px]">
                    {t('nav.today')}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

            {/* Toggle Sem. / Mois */}
            <View className="flex-row bg-card rounded-full p-[3px] border border-subtle">
              <Pressable
                onPress={() => setView('week')}
                className={`px-[14px] py-[6px] rounded-[18px] ${view === 'week' ? 'bg-accent' : ''}`}
              >
                <Text className={`font-inter-semibold text-label ${view === 'week' ? 'text-white' : 'text-text-muted'}`}>
                  {t('toggle.week')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setView('month')}
                className={`px-[14px] py-[6px] rounded-[18px] ${view === 'month' ? 'bg-accent' : ''}`}
              >
                <Text className={`font-inter-semibold text-label ${view === 'month' ? 'text-white' : 'text-text-muted'}`}>
                  {t('toggle.month')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {view === 'week' ? (
          <>
            {/* Scroller jours — rangée fixe de 7, centrée */}
            <View className="px-lg pb-sm">
              <View className="flex-row justify-between">
                {weekDays.map(day => {
                  const key      = dateKey(day);
                  const isActive = isSameDay(day, selectedDay);
                  const isTod    = isToday(day);
                  const tasks    = taskMap.get(key) ?? [];
                  const dots     = Math.min(tasks.length, 3);
                  const color    = resolveDotColor(tasks);

                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSelectedDay(day)}
                      className="items-center gap-[6px]"
                    >
                      <Text className={`font-space-medium text-[12px] leading-[14px] ${isTod ? 'text-accent' : 'text-text-muted'}`}>
                        {daysShort[day.getDay()]}
                      </Text>
                      <View className={`w-9 h-9 rounded-full items-center justify-center ${
                        isActive           ? 'bg-accent' :
                        isTod && !isActive ? 'border border-accent' : ''
                      }`}>
                        <Text className={`font-space-medium text-[15px] ${
                          isActive           ? 'text-white' :
                          isTod && !isActive ? 'text-accent' :
                                               'text-text-secondary'
                        }`}>
                          {day.getDate()}
                        </Text>
                      </View>
                      <View className="flex-row items-center" style={{ gap: 3, height: 6 }}>
                        {Array.from({ length: dots }).map((_, i) => (
                          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Stats semaine */}
            <View className="flex-row px-lg mt-xs mb-md" style={{ gap: 8 }}>
              {[
                { label: t('stats.tasks'),  value: String(stats.total) },
                { label: t('stats.rate'),   value: `${stats.rate}%` },
                { label: t('stats.streak'), value: `🔥 ${stats.streak}${t('stats.streakSuffix')}` },
              ].map(({ label, value }) => (
                <View key={label} className="flex-1 bg-card rounded-md border border-subtle items-center py-sm gap-1">
                  <Text className="font-inter-medium text-[10px] text-text-muted tracking-[1px]">
                    {label}
                  </Text>
                  <Text className="font-space-bold text-[20px] leading-[24px] text-text-primary">
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* Grille mois — fixe, le détail du jour sélectionné scrolle en dessous */
          <View className="px-lg pb-sm">
            <View className="flex-row mb-sm">
              {daysShort.map((d, i) => (
                <Text key={i} className="flex-1 text-center font-space-medium text-[11px] text-text-muted tracking-[0.5px]">
                  {d}
                </Text>
              ))}
            </View>

            {monthGrid.map((week, wi) => (
              <View key={wi} className="flex-row mb-1">
                {week.map(day => {
                  const key      = dateKey(day);
                  const inMonth  = day.getMonth() === monthRef.getMonth();
                  const isActive = isSameDay(day, selectedDay);
                  const isTod    = isToday(day);
                  const tasks    = taskMap.get(key) ?? [];
                  const dots     = Math.min(tasks.length, 3);
                  const color    = resolveDotColor(tasks, inMonth);

                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSelectedDay(day)}
                      className="flex-1 items-center py-1"
                      style={{ gap: 3 }}
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center ${
                        isActive           ? 'bg-accent' :
                        isTod && !isActive ? 'border border-accent' : ''
                      }`}>
                        <Text className={`text-[14px] ${
                          isActive  ? 'font-space-bold text-white'            :
                          isTod     ? 'font-space-medium text-accent'         :
                          !inMonth  ? 'font-space-regular text-subtle'        :
                                      'font-space-regular text-text-secondary'
                        }`}>
                          {day.getDate()}
                        </Text>
                      </View>
                      <View className="flex-row" style={{ gap: 2, height: 5 }}>
                        {Array.from({ length: dots }).map((_, i) => (
                          <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Séparateur entre la zone fixe et la zone scrollable */}
        <View className="h-px bg-subtle mx-lg mb-sm" />
      </View>

      {/* ═══════════════════════════════════════════════════════
          ZONE SCROLLABLE — uniquement le détail des tâches.
      ════════════════════════════════════════════════════════ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {view === 'week' ? (
          sections.length === 0 ? (
            <View className="items-center py-3xl px-lg">
              <Text className="font-inter-regular text-body-m text-text-muted text-center">
                {t('empty.week')}
              </Text>
            </View>
          ) : (
            sections.map(({ day, data }) => {
              const isTod = isToday(day);
              return (
                <View key={dateKey(day)} className="px-lg mb-xl">
                  <View className="flex-row items-center justify-between mb-sm">
                    <Text className={`font-inter-bold text-[13px] tracking-[0.6px] ${isTod ? 'text-accent' : 'text-text-secondary'}`}>
                      {buildDayLabel(day, daysFull, months)}
                    </Text>
                    <View className="flex-row items-center gap-sm">
                      <View className="bg-subtle rounded-full px-[10px] py-1">
                        <Text className="font-inter-bold text-[10px] text-text-secondary tracking-[0.6px]">
                          {t('section.taskCount', { count: data.length })}
                        </Text>
                      </View>
                      {isTod && (
                        <View
                          className="bg-accent-muted rounded-full px-[10px] py-1"
                          style={{ borderWidth: 1, borderColor: 'rgba(255, 107, 26, 0.33)' }}
                        >
                          <Text className="font-inter-bold text-[10px] text-accent tracking-[0.6px]">
                            {t('nav.todayTag')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ gap: 10 }}>
                    {data.map((task: Task) => <TaskCard key={task.id} task={task} />)}
                  </View>
                </View>
              );
            })
          )
        ) : selectedDayTasks.length > 0 ? (
          <View className="px-lg">
            <View className="flex-row items-center justify-between mb-sm">
              <Text className="font-inter-bold text-[13px] tracking-[0.6px] text-text-secondary">
                {buildDayLabel(selectedDay, daysFull, months)}
              </Text>
              <View className="bg-subtle rounded-full px-[10px] py-1">
                <Text className="font-inter-bold text-[10px] text-text-secondary tracking-[0.6px]">
                  {t('section.taskCount', { count: selectedDayTasks.length })}
                </Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {selectedDayTasks.map((task: Task) => <TaskCard key={task.id} task={task} />)}
            </View>
          </View>
        ) : (
          <View className="items-center py-3xl px-lg">
            <Text className="font-inter-regular text-body-m text-text-muted text-center">
              {t('empty.day', {
                day:   selectedDay.getDate(),
                month: months[selectedDay.getMonth()],
              })}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeScreenView>
  );
}