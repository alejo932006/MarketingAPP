import { Audio, staticFile } from 'remotion';

type VoiceoverTrackProps = {
	voiceoverUrl?: string;
	volume?: number;
};

export const VoiceoverTrack: React.FC<VoiceoverTrackProps> = ({
	voiceoverUrl,
	volume = 1,
}) => {
	if (!voiceoverUrl) return null;
	const src = voiceoverUrl.startsWith('http') ? voiceoverUrl : staticFile(voiceoverUrl);
	return <Audio src={src} volume={volume} />;
};
