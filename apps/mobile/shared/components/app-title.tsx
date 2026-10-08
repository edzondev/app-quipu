import { Text, type TextProps } from "react-native";

type Props = {
	title: string;
	subTitle?: string;
} & TextProps;

export default function AppTittle({ title, subTitle, className, ...props }: Props) {
	return (
		<>
			<Text className={`text-[26px] font-newsreader ${className}`} {...props}>
				{title}
			</Text>
			{subTitle && <Text>{subTitle}</Text>}
		</>
	);
}
