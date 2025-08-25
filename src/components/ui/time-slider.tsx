import {
    Slider,
    SliderTrack,
    SliderFill,
    SliderThumb,
    SliderValueLabel,
} from "~/components/ui/slider";
import { format, addMinutes, startOfDay } from "date-fns";

interface TimeSliderProps {
    /** In minutes from midnight */
    timeRange: [number, number];
    onChange: (timeRange: [number, number]) => void;
}

export default function TimeSlider(props: TimeSliderProps) {
    const formatTime = (minutes: number) => {
        const base = startOfDay(new Date());
        return format(addMinutes(base, minutes), "p");
    };

    return (
        <div class="w-[300px] space-y-3">
            <div class="font-medium">
                {formatTime(props.timeRange[0])} - {formatTime(props.timeRange[1])}
            </div>

            <Slider
                minValue={0}
                maxValue={1440}
                step={10} // step = 10 min increments
                value={props.timeRange}
                onChange={props.onChange as any}
            >
                <SliderTrack>
                    <SliderFill />
                </SliderTrack>
                <SliderThumb>
                    <SliderValueLabel>{formatTime(props.timeRange[0])}</SliderValueLabel>
                </SliderThumb>
                <SliderThumb>
                    <SliderValueLabel>{formatTime(props.timeRange[1])}</SliderValueLabel>
                </SliderThumb>
            </Slider>
        </div>
    );
}
