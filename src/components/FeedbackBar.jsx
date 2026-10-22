import { useState } from 'react';
import { MessageSquare, CheckCircle2, X } from 'lucide-react';

export default function FeedbackBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [experienceRating, setExperienceRating] = useState('Great');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!feedbackText.trim()) return;
        setSubmitted(true);
        setTimeout(() => {
            setIsOpen(false);
            setSubmitted(false);
            setFeedbackText('');
        }, 2500);
    };

    return (
        <div className="bg-[#F0ECE1] border-t border-stone-300/80 py-6 px-4 mt-16">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-white text-[#9A7B56] shadow-2xs">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-[#1C1B18]">
                        Your comments help us improve our website
                    </p>
                </div>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-5 py-2.5 rounded-full bg-white hover:bg-[#1C1B18] hover:text-white text-[#1C1B18] border border-stone-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
                >
                    Leave feedback
                </button>
            </div>

            {isOpen && (
                <div className="max-w-xl mx-auto mt-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-lg">
                    {submitted ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold py-4">
                            <CheckCircle2 className="w-5 h-5" /> Thank you! Your feedback helps us improve SJHomeInteriors.co.uk.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-serif text-lg font-bold">Website Feedback</h4>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {['Easy to use', 'Great design', 'Need help finding an item', 'Report an issue'].map(
                                    (tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setExperienceRating(tag)}
                                            className={`px-3 py-1 rounded-full text-[11px] font-medium border cursor-pointer ${experienceRating === tag
                                                    ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                                                    : 'bg-[#FAF8F5] text-stone-600 border-stone-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    )
                                )}
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Tell us what you think about our website or what furniture you'd like to see..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-full bg-[#9A7B56] text-white text-xs font-semibold cursor-pointer"
                            >
                                Submit Feedback
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}