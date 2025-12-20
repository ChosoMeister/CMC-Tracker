
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import jalaali from 'jalaali-js';
import { ChevronRight, ChevronLeft, Calendar, X } from 'lucide-react';

interface JalaliDatePickerProps {
    value: string; // ISO date string (Gregorian)
    onChange: (isoDate: string) => void;
    placeholder?: string;
}

const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Convert English digits to Persian
const toPersianDigits = (num: number | string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// Get days in Jalali month
const getDaysInJalaliMonth = (jy: number, jm: number): number => {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return jalaali.isLeapJalaaliYear(jy) ? 30 : 29;
};

// Get first day of month (Saturday = 0)
const getFirstDayOfMonth = (jy: number, jm: number): number => {
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, 1);
    const date = new Date(gy, gm - 1, gd);
    // Convert Sunday=0 to Saturday=0
    return (date.getDay() + 1) % 7;
};

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'انتخاب تاریخ'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState(1403);
    const [currentMonth, setCurrentMonth] = useState(1);
    const [selectedDate, setSelectedDate] = useState<{ jy: number; jm: number; jd: number } | null>(null);

    // Initialize from value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
            setSelectedDate({ jy, jm, jd });
            setCurrentYear(jy);
            setCurrentMonth(jm);
        } else {
            // Default to today
            const today = new Date();
            const { jy, jm } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
            setCurrentYear(jy);
            setCurrentMonth(jm);
        }
    }, [value]);

    const handleDayClick = (day: number) => {
        const { gy, gm, gd } = jalaali.toGregorian(currentYear, currentMonth, day);
        const isoDate = new Date(gy, gm - 1, gd).toISOString().split('T')[0];
        setSelectedDate({ jy: currentYear, jm: currentMonth, jd: day });
        onChange(isoDate);
        setIsOpen(false);
    };

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Add days of month
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(d);
    }

    const displayValue = selectedDate
        ? `${toPersianDigits(selectedDate.jy)}/${toPersianDigits(selectedDate.jm.toString().padStart(2, '0'))}/${toPersianDigits(selectedDate.jd.toString().padStart(2, '0'))}`
        : '';

    // Calendar popup rendered via portal
    const calendarPopup = isOpen && ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="w-full max-w-xs bg-[var(--card-bg)] border border-[color:var(--border-color)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[color:var(--border-color)] bg-[color:var(--muted-surface)]">
                    <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <div className="font-black text-[color:var(--text-primary)]">
                        {persianMonths[currentMonth - 1]} {toPersianDigits(currentYear)}
                    </div>
                    <button
                        onClick={goToPrevMonth}
                        className="p-2 rounded-xl hover:bg-[color:var(--pill-bg)] transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 p-3 border-b border-[color:var(--border-color)]">
                    {persianWeekDays.map((day, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-[color:var(--text-muted)] py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1 p-3">
                    {days.map((day, i) => (
                        <div key={i} className="aspect-square">
                            {day && (
                                <button
                                    onClick={() => handleDayClick(day)}
                                    className={`w-full h-full rounded-xl text-sm font-bold transition-all flex items-center justify-center
                                        ${selectedDate?.jy === currentYear && selectedDate?.jm === currentMonth && selectedDate?.jd === day
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'hover:bg-[color:var(--muted-surface)] text-[color:var(--text-primary)]'
                                        }`}
                                >
                                    {toPersianDigits(day)}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Today button */}
                <div className="p-3 border-t border-[color:var(--border-color)] flex gap-2">
                    <button
                        onClick={() => {
                            const today = new Date();
                            const { jy, jm, jd } = jalaali.toJalaali(today.getFullYear(), today.getMonth() + 1, today.getDate());
                            setCurrentYear(jy);
                            setCurrentMonth(jm);
                            handleDayClick(jd);
                        }}
                        className="flex-1 py-3 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-colors"
                    >
                        امروز
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 text-sm font-bold text-[color:var(--text-muted)] bg-[color:var(--muted-surface)] hover:bg-[color:var(--pill-bg)] rounded-xl transition-colors"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {/* Input trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[color:var(--muted-surface)] border border-[color:var(--border-color)] rounded-2xl p-4 text-sm font-bold cursor-pointer flex items-center justify-between gap-2 hover:border-blue-500/50 transition-all text-[color:var(--text-primary)]"
            >
                <span className={displayValue ? '' : 'text-[color:var(--text-muted)]'}>
                    {displayValue || placeholder}
                </span>
                <Calendar size={18} className="text-[color:var(--text-muted)]" />
            </div>

            {calendarPopup}
        </>
    );
};
