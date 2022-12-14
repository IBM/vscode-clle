import {expect, test} from 'vitest';
import Module from '../src/module';
import CLParser from "../src/parser";
import {DataType, DefinitionType} from "../src/types";

import simple_def from "./cl/simple_def";
import simple_def_two from "./cl/simple_def_two";
import many_types_ds from './cl/many_types_ds';
import zsavfcl from "./cl/zsavfcl";
import Variable from '../src/variable';
import file_var from './cl/file_var';
import def_label_comment from './cl/def_label_comment';

test('sample test', () => {
    const lines = simple_def;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(48);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);

    const object = statement?.getObject();
    expect(object?.library).toBeUndefined();
    expect(object?.name).toBe(`DCL`);
});

test('token by index', () => {
	const lines = simple_def;

	const parser = new CLParser();
	const tokens = parser.parseDocument(lines);

	const module = new Module();
	module.parseStatements(tokens);

	const token = module.getTokenByOffset(43);
	expect(token).toBeDefined();
	expect(token?.type).toBe(`parameter`);
	expect(token?.value).toBe(`VAR`);
});

test('Very last statement', () => {
    const lines = [
        `RUNSQL `
    ].join(`\n`);

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(7);
    expect(statement).toBeDefined();
});

test('Statement at the middle of the line', () => {
    const lines = many_types_ds;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(22);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);
});

test('Lowercase statements', () => {
    const lines = many_types_ds;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(97);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);
})

test('Statement inside parentheses', () => {
    const lines = many_types_ds;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(208);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);
})

test('Statement line not begin with DCL', () => {
    const lines = many_types_ds;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(351);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Statement);
})

test('Index at the middle of the statement', () => {
    const lines = many_types_ds;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(185);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);
})

test('With symbols', () => {
    const lines = file_var;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(18);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Variable);
})

test('After comments', () => {
    const lines = def_label_comment;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(136);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Statement);
})

test('Large file', () => {
    const lines = zsavfcl;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(702);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Subroutine);
})

test('Several statements separated by space', () => {
    const lines = zsavfcl;

    const parser = new CLParser();
    const tokens = parser.parseDocument(lines);

    const module = new Module();
    module.parseStatements(tokens);

    const statement = module.getStatementByOffset(30);
    expect(statement).toBeDefined();
    expect(statement?.type).toBe(DefinitionType.Statement);
})